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

    // Générer l'URL du fichier
    const cvUrl = `/uploads/${req.file.filename}`;

    // Sauvegarder l'URL du CV en base de données
    await saveCvUrl(userId, cvUrl);

    res.status(200).json({ message: "CV téléversé avec succès", cv_url: cvUrl });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du téléversement du CV", error });
  }
};
