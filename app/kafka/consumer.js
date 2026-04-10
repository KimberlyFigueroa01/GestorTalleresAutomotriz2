const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'gestor-talleres-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'estadisticas-group' });

// Almacén en memoria de todos los eventos
const estadisticas = {
  totalEventos: 0,
  eventosPorTipo: {},
  eventosPorEndpoint: {},
  eventosPorUsuario: {},
  ultimosEventos: [],        // últimos 50 eventos
  errores: 0,
  accesos: {
    sinToken: 0,
    validos: 0,
  },
  operacionesBD: {
    creaciones: 0,
    actualizaciones: 0,
    eliminaciones: 0,
    consultas: 0,
    errores: 0,
  },
};

function registrarEvento(evento) {
  estadisticas.totalEventos++;

  // Contar por tipo
  const tipo = evento.tipo || 'desconocido';
  estadisticas.eventosPorTipo[tipo] = (estadisticas.eventosPorTipo[tipo] || 0) + 1;

  // Contar por endpoint
  if (evento.endpoint) {
    estadisticas.eventosPorEndpoint[evento.endpoint] =
      (estadisticas.eventosPorEndpoint[evento.endpoint] || 0) + 1;
  }

  // Contar por usuario
  if (evento.usuario) {
    estadisticas.eventosPorUsuario[evento.usuario] =
      (estadisticas.eventosPorUsuario[evento.usuario] || 0) + 1;
  }

  // Contadores específicos
  if (tipo === 'acceso_sin_token') estadisticas.accesos.sinToken++;
  if (tipo === 'acceso_valido')    estadisticas.accesos.validos++;
  if (tipo === 'error')            estadisticas.errores++;

  // Operaciones de BD
  if (tipo.includes('_creado'))       estadisticas.operacionesBD.creaciones++;
  if (tipo.includes('_actualizado'))  estadisticas.operacionesBD.actualizaciones++;
  if (tipo.includes('_eliminado'))    estadisticas.operacionesBD.eliminaciones++;
  if (tipo.includes('_consultado') || tipo.includes('_listado')) estadisticas.operacionesBD.consultas++;
  if (tipo.includes('_error'))        estadisticas.operacionesBD.errores++;

  // Guardar en historial (máximo 50)
  estadisticas.ultimosEventos.unshift(evento);
  if (estadisticas.ultimosEventos.length > 50) {
    estadisticas.ultimosEventos.pop();
  }
}

async function initConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'seguridad.accesos', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const evento = JSON.parse(message.value.toString());
          registrarEvento(evento);
          console.log(`[Kafka Consumer] Evento recibido: ${evento.tipo}`);
        } catch (e) {
          console.error('[Kafka Consumer] Error procesando mensaje:', e.message);
        }
      },
    });

    console.log('Consumer Kafka iniciado - monitoreando topic: seguridad.accesos');
  } catch (error) {
    console.warn('[Kafka Consumer] No se pudo iniciar el consumer:', error.message);
  }
}

function getEstadisticas() {
  return {
    ...estadisticas,
    generadoEn: new Date().toISOString(),
  };
}

module.exports = { initConsumer, getEstadisticas };
