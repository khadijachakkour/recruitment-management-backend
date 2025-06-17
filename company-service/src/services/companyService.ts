import Company from "../models/Company";

import Department from "../models/Department";

export const createCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const existingCompany = await Company.getCompanyByUserId(userId);
    if (existingCompany) {
      throw new Error("L'utilisateur a déjà une entreprise.");
    }

    const { departments, ...companyFields } = companyData;

    const company = await Company.create({ ...companyFields, user_id: userId });

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

export const updateCompanyProfile = async (userId: string, companyData: any) => {
  try {
    const company = await Company.getCompanyByUserId(userId);
    if (!company) {
      throw new Error("Aucune entreprise associée à cet utilisateur.");
    }

    const { departments, ...companyFields } = companyData;

    await company.update(companyFields);

    if (Array.isArray(departments)) {
      const existingDepartments = await Department.findAll({
        where: { company_id: company.id },
      });
    
      const departmentsToRemove = existingDepartments.filter(
        (existingDept) => !departments.includes(existingDept.name)
      );
    
      const departmentsToAdd = departments.filter(
        (newDept) => !existingDepartments.some((existingDept) => existingDept.name === newDept)
      );
    
      if (departmentsToRemove.length > 0) {
        const departmentIdsToRemove = departmentsToRemove.map((dept) => dept.id);
        await Department.destroy({ where: { id: departmentIdsToRemove } });
      }
    
      if (departmentsToAdd.length > 0) {
        const newDepartments = departmentsToAdd.map((dept: string) => ({
          name: dept,
          company_id: company.id,
        }));
        await Department.bulkCreate(newDepartments);
      }
    }
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
    return existingCompany !== null; 
  } catch (error) {
    console.error("Erreur lors de la vérification du profil d'entreprise:", error);
    return false; 
  }
};