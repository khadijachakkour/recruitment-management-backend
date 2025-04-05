import { Request, Response } from "express";
import { getUserProfile, updateUserProfile, saveCvUrl } from "../services/profileService";
import { getUserIdFromToken } from "../services/keycloakService";

// Récupérer le profil du candidat
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const profile = await getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil", error });
  }
};

// Mettre à jour le profil
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const updatedProfile = await updateUserProfile(userId, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
  }
};


// 🛠 Définir une interface qui étend Request pour inclure `file`
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 📌 Téléverser un CV
// profileController.ts
import cloudinary from "../utils/cloudinary";
import streamifier from "streamifier";

export const uploadCv = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier reçu" });
      return;
    }

    // Stream du buffer vers Cloudinary
    const streamUpload = () =>
      new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "cvs", // dossier dans Cloudinary
            resource_type: "auto", // pour permettre tous types de fichiers
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        if (!req.file) {
          res.status(400).json({ message: "Aucun fichier reçu" });
          return;
        }
        
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();
    const cvUrl = result.secure_url;

    // Sauvegarder l'URL dans la base
    await saveCvUrl(userId, cvUrl);

    res.status(200).json({ cv_url: cvUrl });
  } catch (error) {
    console.error("Erreur Cloudinary :", error);
    res.status(500).json({ message: "Erreur lors de l'upload du CV", error });
  }
};
