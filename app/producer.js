const { Kafka } = require('kafkajs');
const { getSettings } = require('./core/config');

const settings = getSettings();

const kafka = new Kafka({
  clientId: settings.KAFKA_CLIENT_ID,
  brokers: [settings.KAFKA_BROKER],
});

const producer = kafka.producer();
let connected = false;

async function initProducer() {
  try {
    await producer.connect();
    connected = true;
    console.log('Productor Kafka conectado exitosamente');
  } catch (error) {
    connected = false;
    console.error('[Kafka Producer] No se pudo conectar:', error.message);
    throw error;
  }
}

async function sendEvent(topic, event) {
  if (!connected) {
    const err = new Error('Kafka producer no disponible');
    console.error(`[Kafka Producer] Intento de envío sin conexión (topic=${topic})`);
    throw err;
  }

  const eventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(eventWithTimestamp) }],
    });
    console.log(`[Kafka Producer] Evento enviado al topic "${topic}"`);
  } catch (error) {
    console.error(`[Kafka Producer] Error al enviar evento (topic=${topic}):`, error.message);
    throw error;
  }
}

async function disconnectProducer() {
  if (!connected) return;

  try {
    await producer.disconnect();
    connected = false;
    console.log('Productor Kafka desconectado');
  } catch (error) {
    console.error('[Kafka Producer] Error al desconectar:', error.message);
  }
}

module.exports = {
  initProducer,
  sendEvent,
  disconnectProducer,
};
