import Company from "../models/Company";

export const createCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const existingCompany = await Company.getCompanyByUserId(userId);
    if (existingCompany) {
      throw new Error("L'utilisateur a déjà une entreprise.");
    }

    const company = await Company.create({ ...companyData, user_id: userId });
    return company;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Erreur lors de la création du profil d'entreprise: " + error.message);
    }
    throw new Error("Erreur lors de la création du profil d'entreprise.");
  }
};

export const getCompanyProfile = async (userId: string) => {
  try {
    return await Company.getCompanyByUserId(userId);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Erreur lors de la récupération du profil d'entreprise: " + error.message);
    }
    throw new Error("Erreur lors de la récupération du profil d'entreprise.");
  }
};

export const updateCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const company = await Company.getCompanyByUserId(userId);
    if (!company) {
      throw new Error("Aucune entreprise associée à cet utilisateur.");
    }

    await company.update(companyData);
    return company;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Erreur lors de la mise à jour du profil d'entreprise: " + error.message);
    }
    throw new Error("Erreur lors de la mise à jour du profil d'entreprise.");
  }
};

export const hasCompanyProfile = async (userId: string): Promise<boolean> => {
  try {
    const existingCompany = await Company.getCompanyByUserId(userId);
    return existingCompany !== null; // Renvoie true si l'admin a une entreprise, sinon false
  } catch (error) {
    console.error("Erreur lors de la vérification du profil d'entreprise:", error);
    return false; // En cas d'erreur, on suppose qu'il n'a pas d'entreprise
  }
};
