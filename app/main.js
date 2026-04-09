const express = require('express');
const app = express();
const { getSettings } = require('./core/config');
const { initDatabase } = require('./core/database');
const { keycloakOidc } = require('./core/security');
const { initProducer } = require('./producer');
const routes = require('./api/routes');

const settings = getSettings();

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
      try {
        await initDatabase();
        console.log('BD conectada');
      } catch (error) {
        console.warn('BD no disponible, continuando sin base de datos');
      }
    // Removido: await keycloakOidc.discover(); para validación local
    await initProducer();
  } catch (error) {
    console.log('No se pudo inicializar algunos servicios al iniciar:', error.message);
  }

  app.listen(settings.APP_PORT, settings.APP_HOST, () => {
    console.log(`Servidor corriendo en ${settings.APP_HOST}:${settings.APP_PORT}`);
  });
}

startServer();