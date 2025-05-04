import express from "express";
import upload from "../middlewares/upload"; 
import { MulterRequest, postulerOffre } from "../controllers/candidatureController";
const router = express.Router();

router.post(
    "/postuler",
    upload.fields([
      { name: "cv", maxCount: 1 },
      { name: "cover_letter", maxCount: 1 },
    ]),
    postulerOffre as express.RequestHandler
  );

export default router;
