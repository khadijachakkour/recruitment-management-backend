import axios from "axios";
import { Request, Response } from "express";
import { getCvsAndRank } from "../services/cvMatchingService";
import Candidature from "../models/candidature";

export const matchCvsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const offerId = parseInt(req.params.offerId, 10);
    if (isNaN(offerId)) {
      res.status(400).json({ message: "offerId invalide" });
      return;
    }
    // Récupérer la description de l'offre via offer-service
    const offerServiceUrl ="http://localhost:8081";
    const offerResponse = await axios.get(`${offerServiceUrl}/api/offers/offerById/${offerId}`);
    const offer = offerResponse.data;
    if (!offer || !offer.description) {
      res.status(404).json({ message: "Offre introuvable" });
      return;
    }
    const ranking = await getCvsAndRank(offer.description, offerId);
    // Récupérer toutes les candidatures pour l'offre
    const candidatures = await Candidature.findAll({ where: { offer_id: offerId } });
    const enriched = await Promise.all(ranking.map(async (item: any) => {
      const candidature = candidatures.find((c: any) => c.cvUrl === item.cv || c.cv_url === item.cv);
      let firstName = '', lastName = '', email = '';
      if (candidature) {
        // Appel à user-service pour récupérer les infos du candidat
        try {
          const userRes = await axios.get(`http://localhost:4000/api/users/userbyId/${candidature.candidate_id}`);
          firstName = userRes.data.firstName || '';
          lastName = userRes.data.lastName || '';
          email = userRes.data.email || '';
        } catch {}
      }
      return {
        ...item,
        candidate_id: candidature?.candidate_id,
        firstName,
        lastName,
        email,
        status: candidature?.status,
        submittedAt: candidature?.date_soumission
      };
    }));
    res.status(200).json(enriched);
  } catch (error) {
    console.error("Erreur lors du matching des CVs:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
