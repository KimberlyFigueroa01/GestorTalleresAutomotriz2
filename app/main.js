const express = require('express');
const app = express();
const { getSettings } = require('./core/config');
const { initDatabase } = require('./core/database');
const { syncLegacySchema } = require('./core/sync_legacy_schema');
const { keycloakOidc } = require('./core/security');
const { initProducer, disconnectProducer } = require('./producer');
const { initConsumer, stopConsumer } = require('./kafka/consumer');
const routes = require('./api/routes');

const settings = getSettings();

// CORS para permitir conexiones del frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Middleware de autenticación Keycloak
app.use(require('./core/security').keycloakAuthMiddleware);

// Rutas
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Inicialización
async function startServer() {
  try {
    await initDatabase();
    console.log('Base de datos Oracle conectada');
  } catch (error) {
    console.error('No se pudo conectar a Oracle al iniciar:', error.message);
  }

  try {
    await syncLegacySchema();
  } catch (error) {
    console.error('Error en sincronización de esquema legacy:', error.message);
  }

  try {
    await keycloakOidc.discover();
    console.log('Keycloak conectado');
  } catch (error) {
    console.error('No se pudo inicializar Keycloak al iniciar:', error.message);
  }

  try {
    await initProducer();
  } catch (error) {
    console.error('Kafka producer no disponible; los eventos no se publicarán:', error.message);
  }

  try {
    await initConsumer();
  } catch (error) {
    console.error('Kafka consumer de métricas no disponible:', error.message);
  }

  const server = app.listen(settings.APP_PORT, settings.APP_HOST, () => {
    console.log(`Servidor corriendo en ${settings.APP_HOST}:${settings.APP_PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Puerto ${settings.APP_PORT} en uso. Cierra el proceso anterior o cambia APP_PORT en .env (ej. 8000).`
      );
    } else {
      console.error('Error al iniciar el servidor:', error.message);
    }
    process.exit(1);
  });

  const shutdown = async () => {
    console.log('Cerrando servicios...');
    try {
      await stopConsumer();
    } catch (error) {
      console.error('Error cerrando consumer Kafka:', error.message);
    }
    try {
      await disconnectProducer();
    } catch (error) {
      console.error('Error cerrando producer Kafka:', error.message);
    }
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();