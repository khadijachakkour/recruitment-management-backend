import { Kafka } from 'kafkajs';


export const publishEvent = async (topic: string, message: object) => {
  const kafka = new Kafka({
  clientId: 'recruitment-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
  await producer.connect();
    try {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
} finally {
    await producer.disconnect();
  }
};