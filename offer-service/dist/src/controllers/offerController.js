"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOffersController = exports.deleteOfferController = exports.updateOfferController = exports.getOfferByIdController = exports.getOffersByRecruiterController = exports.createOfferController = void 0;
const offerService_1 = require("../services/offerService");
const createOfferController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerData = req.body;
        const offer = yield (0, offerService_1.createOffer)(req, offerData);
        res.status(201).json({ message: "Offre créée avec succès", offer });
    }
    catch (error) {
        console.error("Erreur lors de la création de l'offre:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.createOfferController = createOfferController;
const getOffersByRecruiterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const offers = yield (0, offerService_1.getOffersByRecruiter)(userId);
        res.status(200).json(offers);
    }
    catch (error) {
        console.error("Erreur lors de la récupération des offres:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.getOffersByRecruiterController = getOffersByRecruiterController;
const getOfferByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const offer = yield (0, offerService_1.getOfferById)(id);
        if (!offer) {
            res.status(404).json({ message: "Offre introuvable" });
            return;
        }
        res.status(200).json(offer);
    }
    catch (error) {
        console.error("Erreur lors de la récupération de l'offre:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.getOfferByIdController = getOfferByIdController;
const updateOfferController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        const offerData = req.body;
        const updatedOffer = yield (0, offerService_1.updateOffer)(id, offerData);
        res.status(200).json({ message: "Offre mise à jour avec succès", updatedOffer });
    }
    catch (error) {
        console.error("Erreur lors de la mise à jour de l'offre:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.updateOfferController = updateOfferController;
const deleteOfferController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        yield (0, offerService_1.deleteOffer)(id);
        res.status(200).json({ message: "Offre supprimée avec succès" });
    }
    catch (error) {
        console.error("Erreur lors de la suppression de l'offre:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.deleteOfferController = deleteOfferController;
const getAllOffersController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offers = yield (0, offerService_1.getAllOffers)();
        res.status(200).json(offers);
    }
    catch (error) {
        console.error("Erreur lors de la récupération des offres:", error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.getAllOffersController = getAllOffersController;
