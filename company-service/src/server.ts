import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import sequelize from "./config/dbConfig";
import Consul from "consul";

const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = process.env.CONSUL_PORT;
const SERVICE_HOST = process.env.SERVICE_HOST || "host.docker.internal";
const PORT = Number(process.env.PORT);

const consul = new Consul({
  host: CONSUL_HOST,
  port: Number(CONSUL_PORT),
});

const serviceId = `company-service-${PORT}`;

async function registerService() {
  await consul.agent.service.register({
    id: serviceId,
    name: "company-service",
    address: SERVICE_HOST,
    port: PORT,
    check: {
      name: "HTTP API health check",
      http: `http://${SERVICE_HOST}:${PORT}/health`,
      interval: "10s",
      timeout: "5s"
    }
  });
  console.log("company-service registered with Consul");
}

async function deregisterService() {
  await consul.agent.service.deregister(serviceId);
  process.exit();
}

process.on("SIGINT", deregisterService);
process.on("SIGTERM", deregisterService);

const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Base de données synchronisée !");
  } catch (error) {
    console.error("Erreur de synchronisation de la base de données : ", error);
  }
};

const startServer = async () => {
  await syncDb();

  app.listen(process.env.PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${process.env.PORT}`);
  });
};

startServer();
