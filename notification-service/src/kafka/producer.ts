import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'recruitment-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

export const publishEvent = async (topic: string, message: object) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
};