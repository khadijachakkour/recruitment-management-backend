import UserProfile from "../models/UserProfile";
import axios from "axios";

// Récupérer le profil d'un utilisateur
export const getUserProfile = async (userId: string) => {
  const profile = await UserProfile.findOne({ where: { user_id: userId } });
  if (!profile) throw new Error("Profil non trouvé");
  return profile;
};

// Mettre à jour le profil de l'utilisateur
export const updateUserProfile = async (userId: string, profileData: any) => {
  const profile = await UserProfile.findOne({ where: { user_id: userId } });
  if (!profile) throw new Error("Profil non trouvé");
  
  await profile.update(profileData);
  return profile;
};

// Enregistrer l'URL du CV
export const saveCvUrl = async (userId: string, cvUrl: string) => {
  const profile = await UserProfile.findOne({ where: { user_id: userId } });
  if (!profile) throw new Error("Profil non trouvé");

  profile.cv_url = cvUrl;
  await profile.save();
};

