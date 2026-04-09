const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'gestor-talleres',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka conectado');
};

const sendEvent = async (topic, event) => {
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
    console.error('Error enviando evento:', error);
  }
};

module.exports = { connectProducer, sendEvent };