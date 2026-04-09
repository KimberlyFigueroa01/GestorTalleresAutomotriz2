const express = require('express');
const router = express.Router();
const ClientesRepository = require('../repositories/clientes_repository');
const ClientesService = require('../services/clientes_service');
const { requireRoles } = require('../core/security');
const { clienteCreateSchema, clienteUpdateSchema } = require('../schemas/clientes');

router.get('/', async (req, res) => {
  try {
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const clientes = await service.list();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.get(clienteId);
    res.json(cliente);
  } catch (error) {
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
      return res.status(400).json({ error: error.details[0].message });
    }
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.create(value);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:clienteId', requireRoles('admin', 'recepcionista'), async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { error, value } = clienteUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const repository = new ClientesRepository();
    const service = new ClientesService(repository);
    const cliente = await service.update(clienteId, value);
    res.json(cliente);
  } catch (error) {
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
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Cliente no encontrado') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;