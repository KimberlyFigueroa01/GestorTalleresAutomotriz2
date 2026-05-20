const Joi = require('joi');

const clienteBaseSchema = Joi.object({
  documento: Joi.string().max(20).required(),
  nombre: Joi.string().max(100).required(),
  telefono: Joi.string().max(15).optional().allow(null, ''),
  correo: Joi.string().email().optional().allow(null, ''),
  direccion: Joi.string().optional().allow(null, ''),
  comuna: Joi.string().max(100).optional().allow(null, ''),
  ciudad: Joi.string().max(100).optional().allow(null, ''),
});

const clienteCreateSchema = clienteBaseSchema;

const clienteUpdateSchema = Joi.object({
  documento: Joi.string().max(20).optional(),
  nombre: Joi.string().max(100).optional(),
  telefono: Joi.string().max(15).optional().allow(null, ''),
  correo: Joi.string().email().optional().allow(null, ''),
  direccion: Joi.string().optional().allow(null, ''),
  comuna: Joi.string().max(100).optional().allow(null, ''),
  ciudad: Joi.string().max(100).optional().allow(null, ''),
});

const clienteFrontendCreateSchema = Joi.object({
  nombre: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  telefono: Joi.string().max(15).required(),
  rut: Joi.string().max(20).required(),
  direccion: Joi.string().required(),
  comuna: Joi.string().max(100).required(),
  ciudad: Joi.string().max(100).required(),
});

const clienteFrontendUpdateSchema = Joi.object({
  nombre: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  telefono: Joi.string().max(15).optional(),
  rut: Joi.string().max(20).optional(),
  direccion: Joi.string().optional(),
  comuna: Joi.string().max(100).optional(),
  ciudad: Joi.string().max(100).optional(),
});

module.exports = {
  clienteCreateSchema,
  clienteUpdateSchema,
  clienteFrontendCreateSchema,
  clienteFrontendUpdateSchema,
};
