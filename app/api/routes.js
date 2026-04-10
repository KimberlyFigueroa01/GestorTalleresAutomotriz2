const express = require('express');
const router = express.Router();
const { sendEvent } = require('../producer');
const { getConnection } = require('../core/database');
const { getEstadisticas } = require('../kafka/consumer');

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
      tipo: 'cliente_creado',
      clienteId: 'mock-12345', // Mock ya que no hay BD conectada
      usuario: req.user?.preferred_username || req.user?.sub || 'desconocido'
    };

    await sendEvent('seguridad.accesos', testEvent);

    res.json({
      status: 'success',
      message: 'Evento cliente_creado enviado a Kafka exitosamente',
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

// Endpoint de prueba de conexión a la base de datos Oracle
router.get('/db-test', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute('SELECT 1 FROM DUAL');
    res.json({
      status: 'ok',
      message: 'Conexión a Oracle DB exitosa',
      result: result.rows
    });
  } catch (error) {
    console.error('Error en ruta /db-test:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'No se pudo conectar a Oracle DB',
      error: error.message
    });
  } finally {
    if (conn) {
      try { await conn.close(); } catch (e) { console.error('Error cerrando conexión:', e.message); }
    }
  }
});

// Endpoint de métricas reales desde Kafka consumer
router.get('/metrics', (req, res) => {
  const stats = getEstadisticas();
  res.json(stats);
});

// Endpoint de últimos eventos (historial)
router.get('/eventos', (req, res) => {
  const stats = getEstadisticas();
  const limite = parseInt(req.query.limite) || 20;
  const tipo = req.query.tipo || null;

  let eventos = stats.ultimosEventos;
  if (tipo) {
    eventos = eventos.filter(e => e.tipo === tipo);
  }

  res.json({
    total: stats.totalEventos,
    mostrando: eventos.slice(0, limite).length,
    eventos: eventos.slice(0, limite),
  });
});

module.exports = router;