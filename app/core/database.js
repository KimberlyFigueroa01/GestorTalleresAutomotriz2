const oracledb = require('oracledb');
const { getSettings } = require('./config');

const settings = getSettings();

let pool;

async function initDatabase() {
  try {
    pool = await oracledb.createPool({
      user: settings.DATABASE_USER,
      password: settings.DATABASE_PASSWORD,
      connectString: `${settings.DATABASE_HOST}:${settings.DATABASE_PORT}/${settings.DATABASE_NAME}`,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    console.log('Conexión a Oracle exitosa');
  } catch (error) {
    console.error('Error conectando a Oracle:', error);
    throw error;
  }
}

async function getConnection() {
  if (!pool) {
    throw new Error('Pool de conexiones no inicializado');
  }
  return await pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close();
  }
}

module.exports = { initDatabase, getConnection, closePool };