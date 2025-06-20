import { Sequelize } from "sequelize";
import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";

dotenv.config({ path: env === "test" ? ".env.test" : ".env" });

console.log("DB_PASSWORD:", process.env.DB_PASSWORD, typeof process.env.DB_PASSWORD);

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default sequelize;