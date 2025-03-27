import { Request, Response } from "express";
import { getUserProfile, updateUserProfile } from "../services/profileService";
import { getUserIdFromToken } from "../services/keycloakService";

// Récupérer le profil de l'utilisateur
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

// Mettre à jour le profil de l'utilisateur
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return;
    }

    const { phone_number, address, experience, education_level, skills, cv_url } = req.body;
    const updatedProfile = await updateUserProfile(userId, {
      phone_number,
      address,
      experience,
      education_level,
      skills,
      cv_url,
    });

    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error });
  }
};
