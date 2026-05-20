const Joi = require('joi');

const ordenUsuarioRefSchema = Joi.object({
  id: Joi.number().integer().optional(),
  nombre: Joi.string().optional().allow(''),
  rol: Joi.string().optional().allow(''),
}).optional().allow(null);

const ordenClienteRefSchema = Joi.object({
  id: Joi.number().integer().optional(),
  nombre: Joi.string().optional().allow(''),
  telefono: Joi.string().optional().allow(''),
});

const ordenVehiculoRefSchema = Joi.object({
  id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  marca: Joi.string().required(),
  modelo: Joi.string().optional().allow(''),
  placa: Joi.string().max(10).required(),
  ano: Joi.number().integer().optional().allow(null),
  color: Joi.string().optional().allow(''),
});

const ordenLineaSchema = Joi.object({
  id: Joi.number().integer().optional(),
  descripcion: Joi.string().required(),
  cantidad: Joi.number().required(),
  precioUnitario: Joi.number().required(),
  descuentoPct: Joi.number().default(0),
  total: Joi.number().optional(),
  repuestoId: Joi.number().integer().optional().allow(null),
});

const ordenNotaSchema = Joi.object({
  id: Joi.number().integer().optional(),
  autor: Joi.string().required(),
  fecha: Joi.string().required(),
  texto: Joi.string().required(),
});

const ordenTareaSchema = Joi.object({
  id: Joi.number().integer().optional(),
  descripcion: Joi.string().required(),
  mecanico: Joi.string().required(),
  completada: Joi.boolean().default(false),
});

const ordenFrontendBaseSchema = {
  numero: Joi.string().optional().allow(''),
  estado: Joi.string().required(),
  tipoServicio: Joi.string().required(),
  descripcion: Joi.string().optional().allow(''),
  fechaCreacion: Joi.string().optional().allow(''),
  fechaLimite: Joi.string().optional().allow(''),
  cliente: ordenClienteRefSchema,
  vehiculo: ordenVehiculoRefSchema,
  tecnicoAsignado: ordenUsuarioRefSchema,
  lineas: Joi.array().items(ordenLineaSchema).default([]),
  inventarioVehiculo: Joi.object().pattern(Joi.string(), Joi.boolean()).default({}),
  kilometraje: Joi.number().integer().default(0),
  nivelCombustible: Joi.number().integer().min(0).max(100).default(0),
  estadoVehiculo: Joi.string().optional().allow(''),
  notas: Joi.array().items(ordenNotaSchema).default([]),
  diagnostico: Joi.string().optional().allow(''),
  tareas: Joi.array().items(ordenTareaSchema).default([]),
  subtotal: Joi.number().optional(),
  descuento: Joi.number().optional(),
  iva: Joi.number().optional(),
  total: Joi.number().optional(),
  prioridad: Joi.string().optional().allow(null, ''),
};

const ordenFrontendCreateSchema = Joi.object(ordenFrontendBaseSchema);
const ordenFrontendUpdateSchema = Joi.object(ordenFrontendBaseSchema).fork(
  Object.keys(ordenFrontendBaseSchema),
  (schema) => schema.optional()
);

const ordenRepuestoCreateSchema = Joi.object({
  orden_id: Joi.number().integer().required(),
  repuesto_id: Joi.number().integer().required(),
  cantidad: Joi.number().integer().min(1).default(1),
});

module.exports = {
  ordenFrontendCreateSchema,
  ordenFrontendUpdateSchema,
  ordenLineaSchema,
  ordenNotaSchema,
  ordenRepuestoCreateSchema,
};
