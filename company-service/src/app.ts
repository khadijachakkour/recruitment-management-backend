import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import companyRoutes from "./routes/companyRoutes";

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(express.json());

app.use("/api/companies", companyRoutes);

export default app;
