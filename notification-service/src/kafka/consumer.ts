import { Kafka, EachMessagePayload } from 'kafkajs';
import Notification from '../models/notification';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

export const kafkaConsumer = async (io: any) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'entretien_planifie', fromBeginning: false });
  await consumer.subscribe({ topic: 'candidature_refusee', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }: EachMessagePayload) => {
      const event = message.value ? JSON.parse(message.value.toString()) : {};
      let notificationMessage = '';

      switch (topic) {
        case 'entretien_planifie':
          notificationMessage = `Entretien planifié pour le ${event.date}`;
          break;
        case 'candidature_refusee':
          notificationMessage = `Votre candidature a été refusée`;
          break;
        default:
          notificationMessage = `Événement inconnu: ${JSON.stringify(event)}`;
      }

      try {
        // Enregistrer dans PostgreSQL avec Sequelize
        const notification = await Notification.create({
          candidatId: event.candidatId,
          message: notificationMessage,
          createdAt: new Date(),
          read: false,
        });

        // Émettre via WebSocket
        io.to(event.candidatId).emit('notification', notification);
        console.log('Notification enregistrée et émise pour le candidat:', event.candidatId, notificationMessage);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la notification:', error);
      }
    },
  });
};