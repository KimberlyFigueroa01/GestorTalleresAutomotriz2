const express = require('express');
const router = express.Router();

// Placeholder
router.get('/ingresos', (req, res) => res.json({}));
router.get('/alertas-stock', (req, res) => res.json([]));
router.get('/ordenes', (req, res) => res.json([]));

module.exports = router;