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
          let dateStr = '';
          if (event.date) {
            const dateObj = new Date(event.date);
            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
            const datePart = dateObj.toLocaleDateString('fr-FR', options);
            const hour = dateObj.getHours().toString().padStart(2, '0');
            const minute = dateObj.getMinutes().toString().padStart(2, '0');
            dateStr = `${datePart} à ${hour}h${minute}`;
          }
          const recruteurName = event.recruteurName || 'le recruteur';
          notificationMessage = `Votre entretien pour le poste ${event.offer_title ?? '...'} est programmé le ${dateStr} avec ${recruteurName}.`;
          if (event.type === 'Visio' && event.jitsiUrl) {
            notificationMessage += ` Il se déroulera en visioconférence. Vous pouvez y accéder via le lien suivant :`;
          }
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
          url: event.jitsiUrl ?? null,
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