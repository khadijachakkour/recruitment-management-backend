"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const offerController_1 = require("../controllers/offerController");
const router = express_1.default.Router();
router.post("/CreateOffer", offerController_1.createOfferController);
router.get("/recruiter/:userId", offerController_1.getOffersByRecruiterController);
router.get("/offers/:id", offerController_1.getOfferByIdController);
router.put("/offers/:id", offerController_1.updateOfferController);
router.delete("/offers/:id", offerController_1.deleteOfferController);
router.get("/offers", offerController_1.getAllOffersController);
exports.default = router;
