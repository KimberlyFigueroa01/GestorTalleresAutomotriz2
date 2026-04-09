const Joi = require('joi');

const clienteBaseSchema = Joi.object({
  documento: Joi.string().max(20).required(),
  nombre: Joi.string().max(100).required(),
  telefono: Joi.string().max(15).optional(),
  correo: Joi.string().email().optional(),
  direccion: Joi.string().optional(),
});

const clienteCreateSchema = clienteBaseSchema;

const clienteUpdateSchema = Joi.object({
  documento: Joi.string().max(20).optional(),
  nombre: Joi.string().max(100).optional(),
  telefono: Joi.string().max(15).optional(),
  correo: Joi.string().email().optional(),
  direccion: Joi.string().optional(),
});

const clienteResponseSchema = clienteBaseSchema.keys({
  id: Joi.string().uuid().required(),
  fecha_registro: Joi.date().required(),
});

module.exports = {
  clienteCreateSchema,
  clienteUpdateSchema,
  clienteResponseSchema,
};