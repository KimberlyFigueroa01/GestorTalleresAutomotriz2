const express = require('express');
const router = express.Router();
const { Cliente } = require('../entities/models');
const ClientesRepository = require('../repositories/clientes_repository');
const ClientesService = require('../services/clientes_service');
const { requireRoles } = require('../core/security');
const {
  clienteCreateSchema,
  clienteUpdateSchema,
  clienteFrontendCreateSchema,
  clienteFrontendUpdateSchema,
} = require('../schemas/clientes');
const { normalizeRow } = require('../core/row_utils');
const { sendEvent } = require('../producer');

async function buildFrontCliente(clienteRaw) {
  const c = normalizeRow(clienteRaw || {});
  const model = new Cliente();
  const vehiculos = await model.countVehiculos(c.documento);

  return {
    id: c.documento,
    nombre: c.nombre,
    email: c.correo ?? c.email ?? null,
    telefono: c.telefono || '',
    rut: c.documento,
    direccion: c.direccion ?? c.domicilio ?? null,
    comuna: c.comuna ?? null,
    ciudad: c.ciudad ?? null,
    vehiculos: Number(vehiculos) || 0,
  };
}

function mapFrontendToDb(payload) {
  const mapped = {
    documento: payload.rut ?? payload.documento ?? payload.id,
    nombre: payload.nombre,
    telefono: payload.telefono,
    correo: payload.email ?? payload.correo,
    direccion: payload.direccion,
    comuna: payload.comuna,
    ciudad: payload.ciudad,
  };
  return Object.fromEntries(
    Object.entries(mapped).filter(([, v]) => v !== undefined)
  );
}

router.get('/', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const service = new ClientesService(new ClientesRepository());
    const clientes = await service.list();
    const results = await Promise.all(clientes.map((c) => buildFrontCliente(c)));
    sendEvent('seguridad.accesos', {
      tipo: 'clientes_listado',
      cantidad: results.length,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:documento', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const service = new ClientesService(new ClientesRepository());
    const cliente = await service.get(req.params.documento);
    res.json(await buildFrontCliente(cliente));
  } catch (error) {
    res.status(error.message === 'Cliente no encontrado' ? 404 : 500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    let validation = clienteFrontendCreateSchema.validate(req.body);
    if (validation.error) {
      validation = clienteCreateSchema.validate(req.body);
    }
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    const dbPayload = mapFrontendToDb(validation.value);
    const service = new ClientesService(new ClientesRepository());
    const cliente = await service.create(dbPayload);

    sendEvent('seguridad.accesos', {
      tipo: 'cliente_creado',
      documento: dbPayload.documento,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});

    res.status(201).json(await buildFrontCliente(cliente));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:documento', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    let validation = clienteFrontendUpdateSchema.validate(req.body);
    if (validation.error) {
      validation = clienteUpdateSchema.validate(req.body);
    }
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    const dbPayload = mapFrontendToDb(validation.value);
    const service = new ClientesService(new ClientesRepository());
    const cliente = await service.update(req.params.documento, dbPayload);
    res.json(await buildFrontCliente(cliente));
  } catch (error) {
    res.status(error.message === 'Cliente no encontrado' ? 404 : 500).json({ error: error.message });
  }
});

router.delete('/:documento', requireRoles('admin'), async (req, res) => {
  try {
    const service = new ClientesService(new ClientesRepository());
    await service.delete(req.params.documento);
    res.status(204).send();
  } catch (error) {
    res.status(error.message === 'Cliente no encontrado' ? 404 : 500).json({ error: error.message });
  }
});

module.exports = router;
