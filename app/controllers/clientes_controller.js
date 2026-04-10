const express = require('express');
const router = express.Router();
const ClientesRepository = require('../repositories/clientes_repository');
const ClientesService = require('../services/clientes_service');
const { requireRoles } = require('../core/security');
const { clienteCreateSchema, clienteUpdateSchema } = require('../schemas/clientes');
const { sendEvent } = require('../producer');

router.get('/', async (req, res) => {
  try {
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const clientes = await service.list();
    sendEvent('seguridad.accesos', {
      tipo: 'clientes_listado',
      cantidad: clientes.length,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.json(clientes);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'clientes_listado_error',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

router.get('/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.get(clienteId);
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_consultado',
      clienteId,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.json(cliente);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: error.message === 'Cliente no encontrado' ? 'cliente_no_encontrado' : 'cliente_consultado_error',
      clienteId: req.params.clienteId,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    if (error.message === 'Cliente no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.post('/', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const { error, value } = clienteCreateSchema.validate(req.body);
    if (error) {
      sendEvent('seguridad.accesos', {
        tipo: 'cliente_creado_error',
        motivo: 'validacion_fallida',
        error: error.details[0].message,
        usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
      }).catch(() => {});
      return res.status(400).json({ error: error.details[0].message });
    }
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.create(value);
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_creado',
      clienteId: cliente?.id || 'nuevo',
      documento: value.documento,
      nombre: value.nombre,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(201).json(cliente);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_creado_error',
      motivo: 'error_bd',
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

router.put('/:clienteId', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { error, value } = clienteUpdateSchema.validate(req.body);
    if (error) {
      sendEvent('seguridad.accesos', {
        tipo: 'cliente_actualizado_error',
        motivo: 'validacion_fallida',
        clienteId,
        error: error.details[0].message,
        usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
      }).catch(() => {});
      return res.status(400).json({ error: error.details[0].message });
    }
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.update(clienteId, value);
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_actualizado',
      clienteId,
      camposActualizados: Object.keys(value),
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.json(cliente);
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_actualizado_error',
      motivo: error.message === 'Cliente no encontrado' ? 'no_encontrado' : 'error_bd',
      clienteId: req.params.clienteId,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    if (error.message === 'Cliente no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.delete('/:clienteId', requireRoles('admin'), async (req, res) => {
  try {
    const { clienteId } = req.params;
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    await service.delete(clienteId);
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_eliminado',
      clienteId,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    res.status(204).send();
  } catch (error) {
    sendEvent('seguridad.accesos', {
      tipo: 'cliente_eliminado_error',
      motivo: error.message === 'Cliente no encontrado' ? 'no_encontrado' : 'error_bd',
      clienteId: req.params.clienteId,
      error: error.message,
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido',
    }).catch(() => {});
    if (error.message === 'Cliente no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;