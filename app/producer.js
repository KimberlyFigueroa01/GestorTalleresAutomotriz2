const { Kafka } = require('kafkajs');

// Configuración del productor Kafka
const kafka = new Kafka({
  clientId: 'gestor-talleres-api',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

// Función para inicializar el productor
async function initProducer() {
  try {
    await producer.connect();
    console.log('Productor Kafka conectado exitosamente');
  } catch (error) {
    console.error('Error al conectar el productor Kafka:', error.message);
    throw error; // Lanzar error para que sea manejado en el nivel superior
  }
}

// Función para enviar eventos
async function sendEvent(topic, event) {
  try {
    // Añadir timestamp automáticamente al evento
    const eventWithTimestamp = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Serializar el mensaje en JSON
    const message = {
      value: JSON.stringify(eventWithTimestamp)
    };

    // Enviar el mensaje al topic
    await producer.send({
      topic: topic,
      messages: [message]
    });

    console.log(`Evento enviado al topic "${topic}":`, eventWithTimestamp);
  } catch (error) {
    console.error('Error al enviar evento a Kafka:', error.message);
    throw error; // Lanzar error para manejo en el llamador
  }
}

// Función para desconectar el productor (opcional, para limpieza)
async function disconnectProducer() {
  try {
    await producer.disconnect();
    console.log('Productor Kafka desconectado');
  } catch (error) {
    console.error('Error al desconectar el productor Kafka:', error.message);
  }
}

module.exports = {
  initProducer,
  sendEvent,
  disconnectProducer
};