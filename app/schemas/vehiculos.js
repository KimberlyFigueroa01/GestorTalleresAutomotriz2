const Joi = require('joi');

// ── Internal schemas (DB-level) ─────────────────────────────────────

const vehiculoBaseSchema = Joi.object({
  placa: Joi.string().max(10).required(),
  marca: Joi.string().max(50).required(),
  modelo: Joi.string().max(50).optional(),
  color: Joi.string().max(30).optional(),
});

const vehiculoCreateSchema = vehiculoBaseSchema.keys({
  cliente_documento: Joi.string().max(20).required(),
});

const vehiculoUpdateSchema = Joi.object({
  marca: Joi.string().max(50).optional(),
  modelo: Joi.string().max(50).optional(),
  color: Joi.string().max(30).optional(),
  cliente_documento: Joi.string().max(20).optional(),
});

const vehiculoResponseSchema = vehiculoBaseSchema.keys({
  cliente_documento: Joi.string().max(20).required(),
});

// ── Frontend-facing schemas (matching reference backend interface) ───

const vehiculoFrontendCreateSchema = Joi.object({
  marca: Joi.string().max(50).required(),
  modelo: Joi.string().max(50).required(),
  ano: Joi.number().integer().optional().allow(null),
  color: Joi.string().max(30).required(),
  placa: Joi.string().max(10).required(),
  tipo: Joi.string().optional().allow(null, ''),
  vin: Joi.string().optional().allow(null, ''),
  km: Joi.number().integer().optional().allow(null),
  clienteDocumento: Joi.string().max(20).required(),
});

const vehiculoFrontendUpdateSchema = Joi.object({
  marca: Joi.string().max(50).optional(),
  modelo: Joi.string().max(50).optional(),
  ano: Joi.number().integer().optional().allow(null),
  color: Joi.string().max(30).optional(),
  placa: Joi.string().max(10).optional(),
  tipo: Joi.string().optional().allow(null, ''),
  vin: Joi.string().optional().allow(null, ''),
  km: Joi.number().integer().optional().allow(null),
  clienteDocumento: Joi.string().max(20).optional(),
});

const vehiculoFrontendResponseSchema = Joi.object({
  id: Joi.string().required(),
  marca: Joi.string().required(),
  modelo: Joi.string().optional().allow(null),
  ano: Joi.number().integer().optional().allow(null),
  color: Joi.string().optional().allow(null),
  placa: Joi.string().required(),
  tipo: Joi.string().optional().allow(null),
  vin: Joi.string().optional().allow(null),
  km: Joi.number().integer().optional().allow(null),
  cliente: Joi.string().optional().allow(null),
  clienteDocumento: Joi.string().optional().allow(null),
});

module.exports = {
  vehiculoCreateSchema,
  vehiculoUpdateSchema,
  vehiculoResponseSchema,
  vehiculoFrontendCreateSchema,
  vehiculoFrontendUpdateSchema,
  vehiculoFrontendResponseSchema,
};
