import Company from "../models/Company";

import Department from "../models/Department";

export const createCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const existingCompany = await Company.getCompanyByUserId(userId);
    if (existingCompany) {
      throw new Error("L'utilisateur a déjà une entreprise.");
    }

    // Récupère les départements depuis les données
    const { departments, ...companyFields } = companyData;

    // Crée l'entreprise
    const company = await Company.create({ ...companyFields, user_id: userId });

    // Crée les départements si fournis
    if (Array.isArray(departments) && departments.length > 0) {
      const departmentRecords = departments.map((dept: string) => ({
        name: dept,
        company_id: company.id,
      }));
      await Department.bulkCreate(departmentRecords);
    }

    return company;
  } catch (error) {
    throw new Error(
      "Erreur lors de la création du profil d'entreprise: " +
        (error instanceof Error ? error.message : "Erreur inconnue.")
    );
  }
};

export const getCompanyProfile = async (userId: string) => {
  try {
    return await Company.findOne({
      where: { user_id: userId },
      include: [{ model: Department, as: "departments" }],
    });
  } catch (error) {
    throw new Error(
      "Erreur lors de la récupération du profil d'entreprise: " +
        (error instanceof Error ? error.message : "Erreur inconnue.")
    );
  }
};


/*export const updateCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const company = await Company.getCompanyByUserId(userId);
    if (!company) {
      throw new Error("Aucune entreprise associée à cet utilisateur.");
    }

    const { departments, ...companyFields } = companyData;

    // Mise à jour du profil entreprise
    await company.update(companyFields);

    // Mise à jour des départements (optionnel : ici on supprime et recrée)
    if (Array.isArray(departments)) {
      await Department.destroy({ where: { company_id: company.id } });
      const departmentRecords = departments.map((dept: string) => ({
        name: dept,
        company_id: company.id,
      }));
      await Department.bulkCreate(departmentRecords);
    }

    return company;
  } catch (error) {
    throw new Error(
      "Erreur lors de la mise à jour du profil d'entreprise: " +
        (error instanceof Error ? error.message : "Erreur inconnue.")
    );
  }
};*/


export const updateCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const company = await Company.getCompanyByUserId(userId);
    if (!company) {
      throw new Error("Aucune entreprise associée à cet utilisateur.");
    }

    const { departments, ...companyFields } = companyData;

    // Mise à jour du profil entreprise
    await company.update(companyFields);

    // Mise à jour des départements (si présents)
    if (Array.isArray(departments)) {
      // Supprimer les anciens départements
      await Department.destroy({ where: { company_id: company.id } });

      // Créer les nouveaux départements
      const newDepartments = departments.map((dept: string) => ({
        name: dept,
        company_id: company.id,
      }));
      await Department.bulkCreate(newDepartments);
    }

    // Recharger avec les départements
    const updatedCompany = await Company.findOne({
      where: { id: company.id },
      include: [{ model: Department, as: "departments" }],
    });

    return updatedCompany;
  } catch (error) {
    throw new Error(
      "Erreur lors de la mise à jour du profil d'entreprise: " +
        (error instanceof Error ? error.message : "Erreur inconnue.")
    );
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