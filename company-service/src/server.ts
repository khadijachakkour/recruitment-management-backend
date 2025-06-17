import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import sequelize from "./config/dbConfig";

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
