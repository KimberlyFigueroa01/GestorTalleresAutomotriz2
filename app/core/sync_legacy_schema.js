const { getConnection } = require('./database');

/**
 * Sincroniza el esquema legacy de la base de datos.
 * Intenta agregar la columna mecanico_asignado a la tabla ordenes
 * si aún no existe. No falla si la columna ya existe o la tabla no existe.
 */
async function syncLegacySchema() {
  let connection;
  try {
    console.log('[Migration] Iniciando sincronización de esquema legacy...');

    connection = await getConnection();

    // Intenta agregar columna mecanico_asignado a tabla ordenes
    try {
      await connection.execute(
        'ALTER TABLE ordenes ADD (mecanico_asignado NUMBER)'
      );
      console.log('[Migration] Columna mecanico_asignado agregada a tabla ordenes');
    } catch (alterError) {
      const errorCode = alterError.errorNum || alterError.code;

      if (errorCode === 1430) {
        // ORA-01430: Intento de agregar columna duplicada
        console.log('[Migration] Columna mecanico_asignado ya existe en tabla ordenes');
      } else if (errorCode === 942) {
        // ORA-00942: Tabla o vista no existe
        console.warn('[Migration] Tabla ordenes no existe aún (se creará con scripts de inicialización)');
      } else {
        // Otros errores: log pero no falla
        console.warn(`[Migration] No se pudo agregar columna mecanico_asignado: ${alterError.message}`);
      }
    }

    console.log('[Migration] Sincronización de esquema completada exitosamente');
  } catch (error) {
    console.error(`[Migration] Error durante sincronización: ${error.message}`);
    // No lanza excepción - permite que el servidor continúe
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('[Migration] Error cerrando conexión:', closeError.message);
      }
    }
  }
}

module.exports = {
  syncLegacySchema,
};
