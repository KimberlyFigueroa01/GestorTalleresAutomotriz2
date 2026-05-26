const express = require('express');
const cors = require('cors');
const app = express();
const { getSettings } = require('./core/config');
const { initDatabase } = require('./core/database');
const { keycloakOidc } = require('./core/security');
const { initProducer, disconnectProducer } = require('./producer');
const { initConsumer, stopConsumer } = require('./kafka/consumer');
const routes = require('./api/routes');
const authRouter = require('./controllers/auth_controller');

const settings = getSettings();

// CORS para permitir conexiones del frontend
app.use(cors({
  origin: [
    'https://taller-mecanico-frontend.onrender.com',
    'http://localhost:4000',
    'http://localhost:4200'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use(express.json());

// Middleware de autenticación Keycloak
app.use(require('./core/security').keycloakAuthMiddleware);

// Alias para compatibilidad con frontend que usa /auth/login
app.use('/auth', authRouter);

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