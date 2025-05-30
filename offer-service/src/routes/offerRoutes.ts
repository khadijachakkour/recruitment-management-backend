import express from "express";
import {
  createOfferController,
  getOffersByRecruiterController,
  getOfferByIdController,
  updateOfferController,
  deleteOfferController,
  getAllOffersController,
  countOffersByRecruiterController, // Ajout du contrôleur
} from "../controllers/offerController";

const router = express.Router();

router.post("/CreateOffer", createOfferController);
router.get("/recruiter/:userId", getOffersByRecruiterController);
router.get("/offerById/:id", getOfferByIdController);
router.put("/:id", updateOfferController);
router.delete("/delete/:id", deleteOfferController);
router.get("/all", getAllOffersController);
router.get("/by-recruiter/:userId", getOffersByRecruiterController);
router.get("/count-by-recruiter/:userId", countOffersByRecruiterController); // Nouvelle route

export default router;