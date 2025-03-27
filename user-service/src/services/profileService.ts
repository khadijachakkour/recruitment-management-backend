import UserProfile from "../models/UserProfile";

// Récupérer le profil d'un utilisateur
export const getUserProfile = async (userId: string) => {
  const profile = await UserProfile.findOne({ where: { user_id: userId } });
  if (!profile) {
    throw new Error("Profil non trouvé");
  }
  return profile;
};

// Mettre à jour le profil de l'utilisateur
export const updateUserProfile = async (userId: string, profileData: any) => {
  const profile = await UserProfile.findOne({ where: { user_id: userId } });

  if (!profile) {
    throw new Error("Profil non trouvé");
  }

  // Mise à jour des champs du profil
  await profile.update(profileData);
  return profile;
};
