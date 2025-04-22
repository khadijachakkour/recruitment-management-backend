import express from "express";
import {
  createOfferController,
  getOffersByRecruiterController,
  getOfferByIdController,
  updateOfferController,
  deleteOfferController,
  getAllOffersController,
} from "../controllers/offerController";

const router = express.Router();

router.post("/CreateOffer", createOfferController);
router.get("/recruiter/:userId", getOffersByRecruiterController);
router.get("/offerById/:id", getOfferByIdController);
router.put("/:id", updateOfferController);
router.delete("/offers/:id", deleteOfferController);
router.get("/all", getAllOffersController);

export default router;