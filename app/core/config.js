require('dotenv').config();

const settings = {
  APP_NAME: process.env.APP_NAME || 'Gestor Taller Automotriz API',
  APP_ENV: process.env.APP_ENV || 'development',
  APP_HOST: process.env.APP_HOST || '0.0.0.0',
  APP_PORT: parseInt(process.env.APP_PORT) || 8000,

  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: parseInt(process.env.DATABASE_PORT) || 1521,
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  DATABASE_NAME: process.env.DATABASE_NAME,

  KEYCLOAK_SERVER_URL: process.env.KEYCLOAK_SERVER_URL,
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_AUDIENCE: process.env.KEYCLOAK_AUDIENCE,
};

function getSettings() {
  return settings;
}

module.exports = { getSettings };