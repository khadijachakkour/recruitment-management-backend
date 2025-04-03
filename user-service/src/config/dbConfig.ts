import { Sequelize } from "sequelize";

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
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
