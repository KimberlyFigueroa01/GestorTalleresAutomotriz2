const Joi = require('joi');

const repuestoFrontendCreateSchema = Joi.object({
  nombre: Joi.string().max(100).required(),
  sku: Joi.string().max(50).optional().allow(null, ''),
  categoria: Joi.string().max(80).optional().allow(null, ''),
  proveedor: Joi.string().max(100).optional().allow(null, ''),
  ubicacion: Joi.string().max(50).optional().allow(null, ''),
  stock: Joi.number().integer().min(0).required(),
  stockMin: Joi.number().integer().min(0).required(),
  stockMax: Joi.number().integer().min(0).optional().allow(null),
  precioCompra: Joi.number().precision(2).optional().allow(null),
  precioVenta: Joi.number().precision(2).required(),
});

const repuestoFrontendUpdateSchema = Joi.object({
  nombre: Joi.string().max(100).optional(),
  sku: Joi.string().max(50).optional().allow(null, ''),
  categoria: Joi.string().max(80).optional().allow(null, ''),
  proveedor: Joi.string().max(100).optional().allow(null, ''),
  ubicacion: Joi.string().max(50).optional().allow(null, ''),
  stock: Joi.number().integer().min(0).optional(),
  stockMin: Joi.number().integer().min(0).optional(),
  stockMax: Joi.number().integer().min(0).optional().allow(null),
  precioCompra: Joi.number().precision(2).optional().allow(null),
  precioVenta: Joi.number().precision(2).optional(),
});

const movimientoCreateSchema = Joi.object({
  repuesto_id: Joi.number().integer().required(),
  tipo_movimiento: Joi.string().valid('ENTRADA', 'SALIDA').required(),
  cantidad: Joi.number().integer().positive().required(),
});

module.exports = {
  repuestoFrontendCreateSchema,
  repuestoFrontendUpdateSchema,
  movimientoCreateSchema,
};
