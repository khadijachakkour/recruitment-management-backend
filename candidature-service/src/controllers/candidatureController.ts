import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary";
import Candidature from "../models/candidature";
import streamifier from "streamifier";

import { getUserIdFromToken } from "../services/CandidatureService";

export interface MulterRequest extends Request {
  files?: {
    cv?: Express.Multer.File[];
    cover_letter?: Express.Multer.File[];
  };
}

export const postulerOffre = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const candidate_id = getUserIdFromToken(req);
    const { offer_id } = req.body;

    if (!offer_id) {
       res.status(400).json({ message: "offer_id invalide" });
       return;
    }
    
    if (!candidate_id) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    // Vérifier si le candidat a déjà postulé
    const existing = await Candidature.findOne({ where: { offer_id, candidate_id } });

    if (existing) {
      res.status(409).json({ message: "Vous avez déjà postulé à cette offre." });
      return;
    }

    const basePublicId = `candidature_${offer_id}_${candidate_id}_${Date.now()}`; // fichier unique

    // Upload CV
    const uploadCV = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "CVsCandidatures",
            public_id: `${basePublicId}_cv`,
            resource_type: "raw",
            format: "pdf",
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url.endsWith(".pdf") ? result.secure_url : `${result.secure_url}.pdf`);
          }
        );
        streamifier.createReadStream(req.files!.cv![0].buffer).pipe(stream);
      });
    };

    // Upload lettre de motivation (si présente)
    const uploadCoverLetter = (): Promise<string | null> => {
      return new Promise((resolve, reject) => {
        if (!req.files?.cover_letter?.[0]) return resolve(null);

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "LettersCandidatures",
            public_id: `${basePublicId}_cover`,
            resource_type: "raw",
            format: "pdf",
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result.secure_url.endsWith(".pdf") ? result.secure_url : `${result.secure_url}.pdf`);
          }
        );
        streamifier.createReadStream(req.files.cover_letter[0].buffer).pipe(stream);
      });
    };

    const [cvUrl, coverLetterUrl] = await Promise.all([
      uploadCV(),
      uploadCoverLetter()
    ]);

    const candidature = await Candidature.create({
      offer_id,
      candidate_id,
      cv_url: cvUrl,
      cover_letter_url: coverLetterUrl,
    });

    res.status(201).json({ message: "Candidature envoyée avec succès", candidature });

  } catch (error) {
    console.error("Erreur lors de la postulation:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
