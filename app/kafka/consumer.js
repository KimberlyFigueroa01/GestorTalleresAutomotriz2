const { Kafka } = require('kafkajs');
const { getSettings } = require('../core/config');

const settings = getSettings();

const DLQ_TOPIC = 'seguridad.accesos.dlq';

const kafka = new Kafka({
  clientId: `${settings.KAFKA_CLIENT_ID}-consumer`,
  brokers: [settings.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'estadisticas-group' });

let dlqProducer = null;

// Almacén en memoria de todos los eventos
const estadisticas = {
  totalEventos: 0,
  eventosPorTipo: {},
  eventosPorEndpoint: {},
  eventosPorUsuario: {},
  ultimosEventos: [],
  errores: 0,
  mensajesFallidos: 0,
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

  const tipo = evento.tipo || 'desconocido';
  estadisticas.eventosPorTipo[tipo] = (estadisticas.eventosPorTipo[tipo] || 0) + 1;

  if (evento.endpoint) {
    estadisticas.eventosPorEndpoint[evento.endpoint] =
      (estadisticas.eventosPorEndpoint[evento.endpoint] || 0) + 1;
  }

  if (evento.usuario) {
    estadisticas.eventosPorUsuario[evento.usuario] =
      (estadisticas.eventosPorUsuario[evento.usuario] || 0) + 1;
  }

  if (tipo === 'acceso_sin_token') estadisticas.accesos.sinToken++;
  if (tipo === 'acceso_valido') estadisticas.accesos.validos++;
  if (tipo === 'error') estadisticas.errores++;

  if (tipo.includes('_creado')) estadisticas.operacionesBD.creaciones++;
  if (tipo.includes('_actualizado')) estadisticas.operacionesBD.actualizaciones++;
  if (tipo.includes('_eliminado')) estadisticas.operacionesBD.eliminaciones++;
  if (tipo.includes('_consultado') || tipo.includes('_listado')) estadisticas.operacionesBD.consultas++;
  if (tipo.includes('_error')) estadisticas.operacionesBD.errores++;

  estadisticas.ultimosEventos.unshift(evento);
  if (estadisticas.ultimosEventos.length > 50) {
    estadisticas.ultimosEventos.pop();
  }
}

function registrarErrorProcesamiento(meta, error) {
  estadisticas.mensajesFallidos++;
  estadisticas.errores++;
  console.error(
    `[Kafka Consumer] Error procesando mensaje (topic=${meta.topic}, partition=${meta.partition}, offset=${meta.offset}):`,
    error.message
  );
}

async function enviarADeadLetter(meta, rawValue, error) {
  if (!dlqProducer) return;

  try {
    await dlqProducer.send({
      topic: DLQ_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            tipo: 'mensaje_no_procesable',
            error: error.message,
            topicOrigen: meta.topic,
            partition: meta.partition,
            offset: meta.offset,
            payloadRaw: rawValue,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (dlqError) {
    console.error('[Kafka Consumer] No se pudo enviar mensaje a DLQ:', dlqError.message);
  }
}

async function initConsumer() {
  try {
    await consumer.connect();
    dlqProducer = kafka.producer();
    await dlqProducer.connect();

    await consumer.subscribe({ topic: 'seguridad.accesos', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const meta = { topic, partition, offset: message.offset };
        const rawValue = message.value ? message.value.toString() : '';

        try {
          const evento = JSON.parse(rawValue);
          registrarEvento(evento);
        } catch (parseError) {
          registrarErrorProcesamiento(meta, parseError);
          await enviarADeadLetter(meta, rawValue, parseError);
        }
      },
    });

    console.log('Consumer Kafka iniciado - monitoreando topic: seguridad.accesos');
  } catch (error) {
    estadisticas.errores++;
    console.error('[Kafka Consumer] No se pudo iniciar el consumidor:', error.message);
    throw error;
  }
}

async function stopConsumer() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error('[Kafka Consumer] Error al desconectar consumer:', error.message);
  }

  if (dlqProducer) {
    try {
      await dlqProducer.disconnect();
    } catch (error) {
      console.error('[Kafka Consumer] Error al desconectar DLQ producer:', error.message);
    } finally {
      dlqProducer = null;
    }
  }
}

function getEstadisticas() {
  return {
    ...estadisticas,
    generadoEn: new Date().toISOString(),
  };
}

module.exports = { initConsumer, stopConsumer, getEstadisticas };
