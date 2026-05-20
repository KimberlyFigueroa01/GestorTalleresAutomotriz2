const Joi = require('joi');

// ── Internal schemas (DB-level) ──────────────────────────────────────

const pagoCreateSchema = Joi.object({
  orden_id: Joi.number().integer().required(),
  monto_total: Joi.number().precision(2).required(),
  metodo_pago: Joi.string().max(50).optional().allow(null, ''),
});

const pagoResponseSchema = Joi.object({
  id: Joi.number().integer().required(),
  orden_id: Joi.number().integer().required(),
  monto_total: Joi.number().required(),
  metodo_pago: Joi.string().optional().allow(null),
  fecha_pago: Joi.date().required(),
});

// ── Frontend-facing schemas (matching reference backend interface) ───

const pagoFrontendCreateSchema = Joi.object({
  id: Joi.string().optional().allow(null, ''),
  ordenId: Joi.string().required(),
  metodo: Joi.string().required(),
  monto: Joi.number().precision(2).required(),
  referencia: Joi.string().optional().allow(null, ''),
  fecha: Joi.string().optional().allow(null, ''),
});

const pagoFrontendResponseSchema = Joi.object({
  id: Joi.string().required(),
  ordenId: Joi.string().required(),
  metodo: Joi.string().required(),
  monto: Joi.number().required(),
  referencia: Joi.string().optional().allow(null),
  fecha: Joi.string().required(),
});

module.exports = {
  pagoCreateSchema,
  pagoResponseSchema,
  pagoFrontendCreateSchema,
  pagoFrontendResponseSchema,
};
