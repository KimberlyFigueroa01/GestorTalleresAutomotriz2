const express = require('express');
const router = express.Router();
const { Vehiculo, Cliente } = require('../entities/models');
const OrdenesRepository = require('../repositories/ordenes_repository');
const OrdenesService = require('../services/ordenes_service');
const { requireRoles } = require('../core/security');
const {
  ordenFrontendCreateSchema,
  ordenFrontendUpdateSchema,
  ordenLineaSchema,
  ordenNotaSchema,
  ordenRepuestoCreateSchema,
} = require('../schemas/ordenes');
const { normalizeRow } = require('../core/row_utils');

function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumericId(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function calculateTotals(lineas) {
  let subtotal = 0;
  let descuento = 0;
  for (const linea of lineas) {
    const cantidad = Number(linea.cantidad || 0);
    const precio = Number(linea.precioUnitario || 0);
    const descuentoPct = Number(linea.descuentoPct || 0);
    subtotal += cantidad * precio;
    descuento += cantidad * precio * (descuentoPct / 100);
  }
  const neto = subtotal - descuento;
  const iva = neto * 0.19;
  const total = neto + iva;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    descuento: Math.round(descuento * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function normalizeLineas(lineas) {
  return (lineas || []).map((linea) => {
    const payload = { ...linea };
    if (payload.total === undefined) {
      const cantidad = Number(payload.cantidad || 0);
      const precio = Number(payload.precioUnitario || 0);
      const descuentoPct = Number(payload.descuentoPct || 0);
      payload.total = Math.round(cantidad * precio * (1 - descuentoPct / 100) * 100) / 100;
    }
    return payload;
  });
}

async function buildFrontOrden(ordenRaw) {
  const orden = normalizeRow(ordenRaw);
  const vehiculoModel = new Vehiculo();
  const clienteModel = new Cliente();

  const vehiculo = orden.placa_vehiculo
    ? await vehiculoModel.findByPlaca(orden.placa_vehiculo)
    : null;
  const v = normalizeRow(vehiculo);
  const cliente = v?.cliente_documento
    ? await clienteModel.findByDocumento(v.cliente_documento)
    : null;
  const c = normalizeRow(cliente);

  const lineas = normalizeLineas(orden.lineas || []);
  const totals = calculateTotals(lineas);

  return {
    id: orden.id,
    numero: orden.numero || String(orden.id).padStart(4, '0'),
    estado: orden.estado || 'ABIERTA',
    tipoServicio: orden.tipo_servicio || 'MANTENCION',
    descripcion: orden.descripcion || '',
    fechaCreacion: orden.fecha_ingreso
      ? new Date(orden.fecha_ingreso).toISOString()
      : '',
    fechaLimite: orden.fecha_entrega
      ? new Date(orden.fecha_entrega).toISOString()
      : orden.fecha_ingreso
        ? new Date(orden.fecha_ingreso).toISOString()
        : '',
    cliente: {
      id: toNumericId(c?.documento),
      nombre: c?.nombre || '',
      telefono: c?.telefono || '',
    },
    vehiculo: {
      id: toNumericId(v?.placa),
      marca: v?.marca || '',
      modelo: v?.modelo || '',
      placa: v?.placa || orden.placa_vehiculo,
      ano: v?.ano || 0,
      color: v?.color || '',
    },
    tecnicoAsignado: orden.tecnico_asignado || null,
    lineas,
    inventarioVehiculo: orden.inventario_vehiculo || {},
    kilometraje: orden.kilometraje || 0,
    nivelCombustible: orden.nivel_combustible || 0,
    estadoVehiculo: orden.estado_vehiculo || '',
    notas: orden.notas || [],
    diagnostico: orden.diagnostico || '',
    tareas: orden.tareas || [],
    subtotal: orden.subtotal != null ? Number(orden.subtotal) : totals.subtotal,
    descuento: orden.descuento != null ? Number(orden.descuento) : totals.descuento,
    iva: orden.iva != null ? Number(orden.iva) : totals.iva,
    total: orden.total != null ? Number(orden.total) : totals.total,
    prioridad: orden.prioridad || null,
  };
}

function mapCreateToDb(value, lineas, totals) {
  return {
    placa_vehiculo: value.vehiculo.placa,
    estado: value.estado,
    numero: value.numero,
    tipo_servicio: value.tipoServicio,
    descripcion: value.descripcion,
    prioridad: value.prioridad,
    diagnostico: value.diagnostico,
    fecha_ingreso: parseIsoDate(value.fechaCreacion) || new Date(),
    fecha_entrega: parseIsoDate(value.fechaLimite),
    lineas,
    inventario_vehiculo: value.inventarioVehiculo || {},
    kilometraje: value.kilometraje,
    nivel_combustible: value.nivelCombustible,
    estado_vehiculo: value.estadoVehiculo,
    notas: value.notas || [],
    tareas: value.tareas || [],
    subtotal: value.subtotal ?? totals.subtotal,
    descuento: value.descuento ?? totals.descuento,
    iva: value.iva ?? totals.iva,
    total: value.total ?? totals.total,
    tecnico_asignado: value.tecnicoAsignado || null,
  };
}

router.get('/', requireRoles('admin', 'mecanico'), async (_req, res) => {
  try {
    const service = new OrdenesService(new OrdenesRepository());
    const ordenes = await service.list();
    const results = await Promise.all(ordenes.map((o) => buildFrontOrden(o)));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resumen/estados', requireRoles('admin', 'mecanico', 'gerencia'), async (_req, res) => {
  try {
    const service = new OrdenesService(new OrdenesRepository());
    const resumen = await service.listResumen();
    res.json(resumen.map((r) => ({
      estado: normalizeRow(r).estado,
      total: Number(normalizeRow(r).total) || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:ordenId', requireRoles('admin', 'mecanico'), async (req, res) => {
  try {
    const service = new OrdenesService(new OrdenesRepository());
    const orden = await service.get(Number(req.params.ordenId));
    res.json(await buildFrontOrden(orden));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'mecanico'), async (req, res) => {
  try {
    const { error, value } = ordenFrontendCreateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const vehiculo = await new Vehiculo().findByPlaca(value.vehiculo.placa);
    if (!vehiculo) {
      return res.status(400).json({ error: 'Vehiculo no encontrado' });
    }

    const lineas = normalizeLineas(value.lineas);
    const totals = calculateTotals(lineas);
    const service = new OrdenesService(new OrdenesRepository());
    const orden = await service.create(mapCreateToDb(value, lineas, totals));
    res.status(201).json(await buildFrontOrden(orden));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:ordenId', requireRoles('admin', 'mecanico'), async (req, res) => {
  try {
    const { error, value } = ordenFrontendUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const ordenId = Number(req.params.ordenId);
    const updates = {};
    if (value.numero !== undefined) updates.numero = value.numero;
    if (value.estado !== undefined) updates.estado = value.estado;
    if (value.tipoServicio !== undefined) updates.tipo_servicio = value.tipoServicio;
    if (value.descripcion !== undefined) updates.descripcion = value.descripcion;
    if (value.fechaCreacion !== undefined) updates.fecha_ingreso = parseIsoDate(value.fechaCreacion);
    if (value.fechaLimite !== undefined) updates.fecha_entrega = parseIsoDate(value.fechaLimite);
    if (value.prioridad !== undefined) updates.prioridad = value.prioridad;
    if (value.diagnostico !== undefined) updates.diagnostico = value.diagnostico;
    if (value.inventarioVehiculo !== undefined) updates.inventario_vehiculo = value.inventarioVehiculo;
    if (value.kilometraje !== undefined) updates.kilometraje = value.kilometraje;
    if (value.nivelCombustible !== undefined) updates.nivel_combustible = value.nivelCombustible;
    if (value.estadoVehiculo !== undefined) updates.estado_vehiculo = value.estadoVehiculo;
    if (value.tecnicoAsignado !== undefined) updates.tecnico_asignado = value.tecnicoAsignado;
    if (value.notas !== undefined) updates.notas = value.notas;
    if (value.tareas !== undefined) updates.tareas = value.tareas;
    if (value.lineas !== undefined) {
      const lineas = normalizeLineas(value.lineas);
      const totals = calculateTotals(lineas);
      updates.lineas = lineas;
      updates.subtotal = totals.subtotal;
      updates.descuento = totals.descuento;
      updates.iva = totals.iva;
      updates.total = totals.total;
    }
    if (value.subtotal !== undefined) updates.subtotal = value.subtotal;
    if (value.descuento !== undefined) updates.descuento = value.descuento;
    if (value.iva !== undefined) updates.iva = value.iva;
    if (value.total !== undefined) updates.total = value.total;

    const service = new OrdenesService(new OrdenesRepository());
    const orden = await service.update(ordenId, updates);
    res.json(await buildFrontOrden(orden));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch('/:ordenId/estado', requireRoles('admin', 'mecanico'), async (req, res) => {
  try {
    const estado = req.body?.estado;
    if (!estado) return res.status(400).json({ error: 'Estado requerido' });
    const service = new OrdenesService(new OrdenesRepository());
    const orden = await service.update(Number(req.params.ordenId), { estado });
    res.json(await buildFrontOrden(orden));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/repuestos', requireRoles('admin', 'mecanico'), async (req, res) => {
  try {
    const { error, value } = ordenRepuestoCreateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const service = new OrdenesService(new OrdenesRepository());
    const row = await service.addRepuesto(value);
    res.status(201).json(normalizeRow(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:ordenId', requireRoles('admin'), async (req, res) => {
  try {
    const service = new OrdenesService(new OrdenesRepository());
    await service.delete(Number(req.params.ordenId));
    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

module.exports = router;
