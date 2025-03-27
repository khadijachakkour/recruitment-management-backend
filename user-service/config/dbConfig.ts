import { Sequelize } from "sequelize";

// Configurez la connexion à PostgreSQL
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST, 
  username: process.env.DB_USER, // Nom d'utilisateur de la base de données
  password: process.env.DB_PASSWORD, // Mot de passe de la base de données
  database: process.env.DB_NAME, // Nom de la base de données
  logging: false, // Désactive le logging SQL dans la console
});

export default sequelize;
