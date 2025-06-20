import express, {Request, Response } from "express";
import entretienRoutes from './routes/entretienRoutes';
import sequelize from './config/dbConfig';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Consul from "consul";


const app = express();

app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/entretiens', entretienRoutes);

// --- AJOUT CONSUL ---
const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = process.env.CONSUL_PORT;
// on utilise "host.docker.internal" car le service entretien n'est pas dans un conteneur , Après la  conteneurisation du entretien-service il faudra definit SERVICE_HOST sur "localhost"
const SERVICE_HOST = process.env.SERVICE_HOST || "host.docker.internal";
const PORT = Number(process.env.PORT);

//Création du client Consul
const consul = new Consul({
  host: CONSUL_HOST,
  port: Number(CONSUL_PORT),
});

// ID du service pour Consul
// On utilise le port pour différencier les instances si plusieurs sont lancées
const serviceId = `entretien-service-${PORT}`;

//Fonction d’enregistrement du service
async function registerService() {
  await consul.agent.service.register({
    id: serviceId,
    name: "entretien-service",
    address: SERVICE_HOST,
    port: PORT,
    check: {
      name: "HTTP API health check",
      http: `http://${SERVICE_HOST}:${PORT}/health`,
      interval: "10s",
      timeout: "5s"
    }
  });
  console.log("entretien-service registered with Consul");
}

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});
registerService();

process.on("SIGINT", async () => {
  await consul.agent.service.deregister(serviceId);
  process.exit();
});

// Synchroniser la base de données
const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée !");
  } catch (error) {
    console.error("Erreur de synchronisation de la base de données : ", error);
  }
};

syncDb();

app.listen(process.env.PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});
