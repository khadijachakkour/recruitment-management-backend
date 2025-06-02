import express from "express";
import upload from "../middlewares/upload"; 
import {postulerOffre, getCandidaturesByOfferId, countCandidaturesByOfferId, updateCandidature, getCandidatureById } from "../controllers/candidatureController";
import { matchCvsController } from "../controllers/matchCvsController";

const router = express.Router();

router.post( "/postuler",upload.fields([{ name: "cv", maxCount: 1 },{ name: "cover_letter", maxCount: 1 },]),
    postulerOffre as express.RequestHandler
  );

router.get("/by-offer/:offerId", getCandidaturesByOfferId);
router.get("/count/by-offer/:offerId", countCandidaturesByOfferId);
router.get("/match-cvs/:offerId", matchCvsController);

// Récupérer une candidature par son ID
router.get('/:id', getCandidatureById);

// Modifier une candidature par ID
router.patch('/update/:id', updateCandidature);

export default router;
