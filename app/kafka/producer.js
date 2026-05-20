const { Kafka } = require('kafkajs');
const { getSettings } = require('../core/config');

const settings = getSettings();

const kafka = new Kafka({
  clientId: settings.KAFKA_CLIENT_ID,
  brokers: [settings.KAFKA_BROKER],
});

const producer = kafka.producer();
let connected = false;

const connectProducer = async () => {
  try {
    await producer.connect();
    connected = true;
    console.log('Kafka conectado');
  } catch (error) {
    connected = false;
    console.error('[Kafka] Error al conectar productor:', error.message);
    throw error;
  }
};

const sendEvent = async (topic, event) => {
  if (!connected) {
    throw new Error('Kafka producer no disponible');
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error) {
    console.error(`[Kafka] Error enviando evento (topic=${topic}):`, error.message);
    throw error;
  }
};

module.exports = { connectProducer, sendEvent };
