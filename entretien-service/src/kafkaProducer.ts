import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'entretien-service',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

export const publishKafkaEvent = async (topic: string, message: object) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  await producer.disconnect();
};