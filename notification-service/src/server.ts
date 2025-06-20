import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { kafkaConsumer } from './kafka/consumer';
import notificationRoutes from './routes/notificationRoutes';
import sequelize, { initDb } from './config/dbConfig';
import express, {Request, Response } from "express";
import Consul from "consul";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true },
});

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use('/api', notificationRoutes);

// --- Ajout du endpoint health check ---
app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});

// --- Configuration Consul ---
const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = process.env.CONSUL_PORT;
const SERVICE_HOST = process.env.SERVICE_HOST || "host.docker.internal";
const PORT = Number(process.env.PORT);

const consul = new Consul({
  host: CONSUL_HOST,
  port: Number(CONSUL_PORT),
});

const serviceId = `notification-service-${PORT}`;

async function registerService() {
  await consul.agent.service.register({
    id: serviceId,
    name: "notification-service",
    address: SERVICE_HOST,
    port: PORT,
    check: {
      name: "HTTP API health check",
      http: `http://${SERVICE_HOST}:${PORT}/health`,
      interval: "10s",
      timeout: "5s"
    }
  });
  console.log("notification-service registered with Consul");
}

async function deregisterService() {
  await consul.agent.service.deregister(serviceId);
  process.exit();
}

process.on("SIGINT", deregisterService);
process.on("SIGTERM", deregisterService);


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

  server.listen(process.env.PORT, async () => {
      console.log(`Notification Service listening on port ${process.env.PORT}`);
      await registerService();
      kafkaConsumer(io);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();