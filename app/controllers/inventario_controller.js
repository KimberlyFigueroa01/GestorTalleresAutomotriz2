const express = require('express');
const router = express.Router();
const InventarioRepository = require('../repositories/inventario_repository');
const InventarioService = require('../services/inventario_service');
const { requireRoles } = require('../core/security');
const {
  repuestoFrontendCreateSchema,
  repuestoFrontendUpdateSchema,
  movimientoCreateSchema,
} = require('../schemas/inventario');
const { normalizeRow } = require('../core/row_utils');

function buildFrontRepuesto(itemRaw) {
  const item = normalizeRow(itemRaw);
  return {
    id: item.id,
    nombre: item.nombre_repuesto,
    sku: item.sku || null,
    categoria: item.categoria || null,
    proveedor: item.proveedor || null,
    ubicacion: item.ubicacion || null,
    stock: Number(item.stock_actual) || 0,
    stockMin: Number(item.stock_minimo) || 0,
    stockMax: item.stock_maximo != null ? Number(item.stock_maximo) : null,
    precioCompra: item.precio_compra != null ? Number(item.precio_compra) : null,
    precioVenta: Number(item.precio_venta) || 0,
  };
}

function mapCreateToDb(value) {
  return {
    nombre_repuesto: value.nombre,
    sku: value.sku,
    categoria: value.categoria,
    proveedor: value.proveedor,
    ubicacion: value.ubicacion,
    stock_actual: value.stock,
    stock_minimo: value.stockMin,
    stock_maximo: value.stockMax,
    precio_compra: value.precioCompra,
    precio_venta: value.precioVenta,
  };
}

function mapUpdateToDb(value) {
  const db = {};
  if (value.nombre !== undefined) db.nombre_repuesto = value.nombre;
  if (value.sku !== undefined) db.sku = value.sku;
  if (value.categoria !== undefined) db.categoria = value.categoria;
  if (value.proveedor !== undefined) db.proveedor = value.proveedor;
  if (value.ubicacion !== undefined) db.ubicacion = value.ubicacion;
  if (value.stock !== undefined) db.stock_actual = value.stock;
  if (value.stockMin !== undefined) db.stock_minimo = value.stockMin;
  if (value.stockMax !== undefined) db.stock_maximo = value.stockMax;
  if (value.precioCompra !== undefined) db.precio_compra = value.precioCompra;
  if (value.precioVenta !== undefined) db.precio_venta = value.precioVenta;
  return db;
}

router.get('/', requireRoles('admin', 'almacen'), async (_req, res) => {
  try {
    const service = new InventarioService(new InventarioRepository());
    const items = await service.list();
    res.json(items.map(buildFrontRepuesto));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/movimientos', requireRoles('admin', 'almacen'), async (_req, res) => {
  try {
    const service = new InventarioService(new InventarioRepository());
    const movimientos = await service.listMovimientos();
    res.json(movimientos.map(normalizeRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alertas', requireRoles('admin', 'almacen'), async (_req, res) => {
  try {
    const service = new InventarioService(new InventarioRepository());
    const items = await service.listAlertas();
    res.json(items.map(buildFrontRepuesto));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRoles('admin', 'almacen'), async (req, res) => {
  try {
    const { error, value } = repuestoFrontendCreateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const service = new InventarioService(new InventarioRepository());
    const item = await service.create(mapCreateToDb(value));
    res.status(201).json(buildFrontRepuesto(item));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:repuestoId', requireRoles('admin', 'almacen'), async (req, res) => {
  try {
    const { error, value } = repuestoFrontendUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const service = new InventarioService(new InventarioRepository());
    const item = await service.update(Number(req.params.repuestoId), mapUpdateToDb(value));
    res.json(buildFrontRepuesto(item));
  } catch (error) {
    res.status(error.message === 'Repuesto no encontrado' ? 404 : 500).json({ error: error.message });
  }
});

router.post('/movimientos', requireRoles('admin', 'almacen'), async (req, res) => {
  try {
    const { error, value } = movimientoCreateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const service = new InventarioService(new InventarioRepository());
    const movimiento = await service.createMovimiento(value);
    res.status(201).json(normalizeRow(movimiento));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:repuestoId', requireRoles('admin'), async (req, res) => {
  try {
    const service = new InventarioService(new InventarioRepository());
    await service.delete(Number(req.params.repuestoId));
    res.status(204).send();
  } catch (error) {
    res.status(error.message === 'Repuesto no encontrado' ? 404 : 500).json({ error: error.message });
  }
});

module.exports = router;
