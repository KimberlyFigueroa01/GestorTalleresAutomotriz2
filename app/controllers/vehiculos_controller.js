const express = require('express');
const router = express.Router();
// Similar a clientes, con VehiculosRepository, etc.

router.get('/', async (req, res) => {
  // Implementar
  res.json([]);
});

router.get('/:placa', async (req, res) => {
  // Implementar
});

router.post('/', async (req, res) => {
  // Implementar
});

router.put('/:placa', async (req, res) => {
  // Implementar
});

router.delete('/:placa', async (req, res) => {
  // Implementar
});

module.exports = router;