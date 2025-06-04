import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { kafkaConsumer } from './kafka/consumer';
import notificationRoutes from './routes/notificationRoutes';
import sequelize, { initDb } from './config/dbConfig';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true },
});

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use('/api', notificationRoutes);

io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('join', (candidatId: string) => {
    socket.join(candidatId);
    console.log(`Client ${socket.id} a rejoint la room ${candidatId}`);
  });
});

const startServer = async () => {
  try {
    await initDb();
    await sequelize.sync({ alter: true });
    console.log('Base de données synchronisée avec succès.');

    server.listen(process.env.PORT, () => {
      console.log(`Notification Service listening on port ${process.env.PORT}`);
      kafkaConsumer(io); // Passer io au consommateur Kafka
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();