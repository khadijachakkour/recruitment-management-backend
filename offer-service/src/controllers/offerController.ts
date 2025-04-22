import { Request, Response } from "express";
import {
  createOffer,
  getOffersByRecruiter,
  getOfferById,
  updateOffer,
  deleteOffer,
  getAllOffers,
} from "../services/offerService";

export const createOfferController = async (req: Request, res: Response) => {
  try {
    const offerData = req.body;
    const offer = await createOffer(req, offerData);
    res.status(201).json({ message: "Offre créée avec succès", offer });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'offre:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getOffersByRecruiterController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const offers = await getOffersByRecruiter(userId);
    res.status(200).json(offers);
    console.log(offers);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des offres:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getOfferByIdController= async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const offer = await getOfferById(id);
    if (!offer) {
       res.status(404).json({ message: "Offre introuvable" });
       return;
    }
    res.status(200).json(offer);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'offre:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateOfferController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const offerData = req.body;
    const updatedOffer = await updateOffer(id, offerData);
    res.status(200).json({ message: "Offre mise à jour avec succès", updatedOffer });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'offre:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const deleteOfferController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteOffer(id);
    res.status(200).json({ message: "Offre supprimée avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'offre:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAllOffersController = async (_req: Request, res: Response) => {
  try {
    const offers = await getAllOffers();
    res.status(200).json(offers);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des offres:", error.message);
    res.status(500).json({ error: error.message });
  }
};