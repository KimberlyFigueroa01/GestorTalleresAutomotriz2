const express = require('express');
const router = express.Router();
const VehiculosRepository = require('../repositories/vehiculos_repository');
const VehiculosService = require('../services/vehiculos_service');
const ClientesRepository = require('../repositories/clientes_repository');
const { requireRoles } = require('../core/security');
const { vehiculoFrontendCreateSchema, vehiculoFrontendUpdateSchema } = require('../schemas/vehiculos');
const { sendEvent } = require('../producer');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Normalizes Oracle UPPERCASE keys to lowercase.
 */
function normalizeRow(row) {
  if (!row) return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

/**
 * Resolves and validates that a cliente exists by documento.
 */
async function resolveClienteDocumento(documento) {
  const clientesRepo = new ClientesRepository();
  const cliente = await clientesRepo.get(documento);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const c = normalizeRow(cliente);
  return c.documento;
}

/**
 * Builds a frontend-compatible response from a DB vehiculo row.
 * Mirrors the reference backend's _build_front_vehiculo function.
 */
async function buildFrontVehiculo(vehiculoRaw) {
  const v = normalizeRow(vehiculoRaw);
  let clienteNombre = null;

  if (v.cliente_documento) {
    try {
      const clientesRepo = new ClientesRepository();
      const cliente = await clientesRepo.get(v.cliente_documento);
      if (cliente) {
        const c = normalizeRow(cliente);
        clienteNombre = c.nombre || null;
      }
    } catch (_) {
      // Client lookup is best-effort
    }
  }

  return {
    id: v.placa,
    marca: v.marca,
    modelo: v.modelo || null,
    ano: v.ano || null,
    color: v.color || null,
    placa: v.placa,
    tipo: v.tipo || null,
    vin: v.vin || null,
    km: v.km || null,
    cliente: clienteNombre,
    clienteDocumento: v.cliente_documento || null,
  };
}

// ── Routes ──────────────────────────────────────────────────────────

router.get('/', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const repository = new VehiculosRepository();
    const service = new VehiculosService(repository);
    const vehiculos = await service.list();

    const results = [];
    for (const vehiculo of vehiculos) {
      results.push(await buildFrontVehiculo(vehiculo));
    }

    sendEvent('seguridad.accesos', {
      tipo: 'vehiculos_listado',
      cantidad: results.length,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.json(results);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'vehiculos_listado_error',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get('/:placa', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const { placa } = req.params;
    const repository = new VehiculosRepository();
    const service = new VehiculosService(repository);
    const vehiculo = await service.get(placa);

    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_consultado',
      placa,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.json(await buildFrontVehiculo(vehiculo));
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: error.statusCode === 404 ? 'vehiculo_no_encontrado' : 'vehiculo_consultado_error',
      placa: req.params.placa,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'recepcionista'), async (req, res) => {
  console.log(`[VEHICULOS POST] Iniciando creación de vehículo. Body:`, req.body);
  try {
    const { error, value } = vehiculoFrontendCreateSchema.validate(req.body);
    if (error) {
      console.log(`[VEHICULOS POST] Error de validación: ${error.details[0].message}`);
      sendEvent('seguridad.accesos', {
        tipo: 'vehiculo_creado_error',
        motivo: 'validacion_fallida',
        error: error.details[0].message,
        usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
      }).catch(() => {});
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log(`[VEHICULOS POST] Validación exitosa. Payload normalizado:`, value);
    const repository = new VehiculosRepository();
    const service = new VehiculosService(repository);

    const clienteDocumento = await resolveClienteDocumento(value.clienteDocumento);

    // Map frontend payload to DB-compatible payload
    const dbPayload = {
      placa: value.placa,
      marca: value.marca,
      modelo: value.modelo,
      color: value.color,
      cliente_documento: clienteDocumento,
      ano: value.ano ?? null,
      tipo: value.tipo || null,
      vin: value.vin || null,
      km: value.km ?? null,
    };

    console.log(`[VEHICULOS POST] Creando vehículo en BD con:`, dbPayload);
    const vehiculo = await service.create(dbPayload);
    console.log(`[VEHICULOS POST] Vehículo creado exitosamente:`, vehiculo);

    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_creado',
      placa: value.placa,
      marca: value.marca,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(201).json(await buildFrontVehiculo(vehiculo));
  } catch (error) {
    console.log(`[VEHICULOS POST] Error durante creación: ${error.message}`);
    console.log(`[VEHICULOS POST] Error stack:`, error.stack);
    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_creado_error',
      motivo: error.statusCode === 409 ? 'duplicado' : 'error_bd',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.put('/:placa', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const { placa } = req.params;
    const { error, value } = vehiculoFrontendUpdateSchema.validate(req.body);
    if (error) {
      sendEvent('seguridad.accesos', {
        tipo: 'vehiculo_actualizado_error',
        motivo: 'validacion_fallida',
        placa,
        error: error.details[0].message,
        usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
      }).catch(() => {});
      return res.status(400).json({ error: error.details[0].message });
    }

    const repository = new VehiculosRepository();
    const service = new VehiculosService(repository);

    // Map only provided frontend fields to DB-compatible fields
    const dbUpdates = {};
    if (value.marca !== undefined) dbUpdates.marca = value.marca;
    if (value.modelo !== undefined) dbUpdates.modelo = value.modelo;
    if (value.color !== undefined) dbUpdates.color = value.color;
    if (value.ano !== undefined) dbUpdates.ano = value.ano;
    if (value.tipo !== undefined) dbUpdates.tipo = value.tipo;
    if (value.vin !== undefined) dbUpdates.vin = value.vin;
    if (value.km !== undefined) dbUpdates.km = value.km;
    if (value.clienteDocumento !== undefined) {
      dbUpdates.cliente_documento = await resolveClienteDocumento(value.clienteDocumento);
    }

    const vehiculo = await service.update(placa, dbUpdates);

    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_actualizado',
      placa,
      camposActualizados: Object.keys(dbUpdates),
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.json(await buildFrontVehiculo(vehiculo));
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_actualizado_error',
      motivo: error.statusCode === 404 ? 'no_encontrado' : 'error_bd',
      placa: req.params.placa,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.delete('/:placa', requireRoles('admin'), async (req, res) => {
  try {
    const { placa } = req.params;
    const repository = new VehiculosRepository();
    const service = new VehiculosService(repository);
    await service.delete(placa);

    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_eliminado',
      placa,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(204).send();
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'vehiculo_eliminado_error',
      motivo: error.statusCode === 404 ? 'no_encontrado' : 'error_bd',
      placa: req.params.placa,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

module.exports = router;