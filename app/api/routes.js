const express = require('express');
const router = express.Router();
const { sendEvent } = require('../producer');

// Importar routers de controladores
const authRouter = require('../controllers/auth_controller');
const clientesRouter = require('../controllers/clientes_controller');
const vehiculosRouter = require('../controllers/vehiculos_controller');
const inventarioRouter = require('../controllers/inventario_controller');
const ordenesRouter = require('../controllers/ordenes_controller');
const pagosRouter = require('../controllers/pagos_controller');
const historialRouter = require('../controllers/historial_controller');
const reportesRouter = require('../controllers/reportes_controller');

// Incluir routers
router.use('/auth', authRouter);
router.use('/clientes', clientesRouter);
router.use('/vehiculos', vehiculosRouter);
router.use('/inventario', inventarioRouter);
router.use('/ordenes', ordenesRouter);
router.use('/pagos', pagosRouter);
router.use('/historial', historialRouter);
router.use('/reportes', reportesRouter);

// Ruta de prueba para Kafka
router.get('/test-kafka', async (req, res) => {
  try {
    const testEvent = {
      action: 'test_access',
      user: 'admin',
      details: 'Prueba de integración Kafka'
    };

    await sendEvent('seguridad.accesos', testEvent);

    res.json({
      status: 'success',
      message: 'Evento enviado a Kafka exitosamente',
      event: testEvent
    });
  } catch (error) {
    console.error('Error en ruta /test-kafka:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error al enviar evento a Kafka',
      error: error.message
    });
  }
});

module.exports = router;