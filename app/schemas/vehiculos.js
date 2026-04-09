const Joi = require('joi');

const vehiculoBaseSchema = Joi.object({
  placa: Joi.string().max(10).required(),
  marca: Joi.string().max(50).required(),
  modelo: Joi.string().max(50).optional(),
  color: Joi.string().max(30).optional(),
});

const vehiculoCreateSchema = vehiculoBaseSchema.keys({
  cliente_id: Joi.string().uuid().required(),
});

const vehiculoUpdateSchema = Joi.object({
  marca: Joi.string().max(50).optional(),
  modelo: Joi.string().max(50).optional(),
  color: Joi.string().max(30).optional(),
  cliente_id: Joi.string().uuid().optional(),
});

const vehiculoResponseSchema = vehiculoBaseSchema.keys({
  cliente_id: Joi.string().uuid().required(),
});

module.exports = {
  vehiculoCreateSchema,
  vehiculoUpdateSchema,
  vehiculoResponseSchema,
};