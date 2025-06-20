import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import bodyParser from "body-parser";
import offerRoutes from "./routes/offerRoutes";
import sequelize from "./config/dbConfig";
import express, {Request, Response } from "express";
import Consul from "consul";


const app = express();

// Middlewares
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use("/api/offers", offerRoutes);

// --- AJOUT CONSUL ---
const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = process.env.CONSUL_PORT;
// on utilise "host.docker.internal" car le service offer n'est pas dans un conteneur , Après la  conteneurisation du offer-service il faudra definit SERVICE_HOST sur "localhost"
const SERVICE_HOST = process.env.SERVICE_HOST || "host.docker.internal";
const PORT = Number(process.env.PORT);

//Création du client Consul
const consul = new Consul({
  host: CONSUL_HOST,
  port: Number(CONSUL_PORT),
});

// ID du service pour Consul
// On utilise le port pour différencier les instances si plusieurs sont lancées
const serviceId = `offer-service-${PORT}`;

//Fonction d’enregistrement du service
async function registerService() {
  await consul.agent.service.register({
    id: serviceId,
    name: "offer-service",
    address: SERVICE_HOST,
    port: PORT,
    check: {
      name: "HTTP API health check",
      http: `http://${SERVICE_HOST}:${PORT}/health`,
      interval: "10s",
      timeout: "5s"
    }
  });
  console.log("offer-service registered with Consul");
}

app.get("/health", (req: Request, res: Response) => {
  res.send("OK");
});
registerService();

process.on("SIGINT", async () => {
  await consul.agent.service.deregister(serviceId);
  process.exit();
});

// Synchronisation de la base de données
const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée !");
  } catch (error) {
    console.error("Erreur de synchronisation de la base de données :", error);
  }
};

syncDb();

// Démarrage du serveur
app.listen(process.env.PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
});