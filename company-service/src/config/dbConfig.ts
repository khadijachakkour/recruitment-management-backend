import { Sequelize } from "sequelize";

// Configurez la connexion à PostgreSQL
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST, 
  username: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  logging: false, 
});

export default sequelize;
