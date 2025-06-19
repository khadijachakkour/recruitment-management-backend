import { createCompanyProfile, getCompanyProfile, updateCompanyProfile, hasCompanyProfile } from '../../../src/services/companyService';
import sequelize from '../../../src/config/dbConfig';
import Company from '../../../src/models/Company';
import Department from '../../../src/models/Department';

let originalConsoleError: typeof console.error;

beforeAll(() => {
  originalConsoleError = console.error;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore?.();
  console.error = originalConsoleError;
});

describe('Tests d\'intégration - companyService', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base :', error);
      throw error;
    }
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch (error) {
      console.error('Erreur lors de la fermeture :', error);
    }
  });

  describe('createCompanyProfile', () => {
    it('devrait créer une entreprise avec des départements', async () => {
      const companyData = {
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        otherIndustry: null,
        departments: ['Ingénierie', 'Marketing'],
      };

      const company = await createCompanyProfile('user-123', companyData);

      expect(company).toHaveProperty('id');
      expect(company.companyName).toBe('Entreprise Test');
      expect(company.user_id).toBe('user-123');

      const departments = await Department.findAll({ where: { company_id: company.id } });
      expect(departments.length).toBe(2);
      expect(departments.map((d) => d.name)).toEqual(expect.arrayContaining(['Ingénierie', 'Marketing']));
    });

    it('devrait créer une entreprise sans départements', async () => {
      const companyData = {
        companyName: 'Entreprise Sans Départements',
        industry: 'Finance',
        companyDescription: 'Description sans départements',
        otherIndustry: null,
      };

      const company = await createCompanyProfile('user-123', companyData);

      expect(company.companyName).toBe('Entreprise Sans Départements');
      expect(company.user_id).toBe('user-123');

      const departments = await Department.findAll({ where: { company_id: company.id } });
      expect(departments.length).toBe(0);
    });

    it('devrait échouer si une entreprise existe déjà', async () => {
      await Company.create({
        companyName: 'Entreprise Existante',
        industry: 'Technologie',
        companyDescription: 'Description existante',
        user_id: 'user-123',
        otherIndustry: null,
      });

      const companyData = {
        companyName: 'Nouvelle Entreprise',
        industry: 'Technologie',
        companyDescription: 'Nouvelle description',
        otherIndustry: null,
      };

      await expect(createCompanyProfile('user-123', companyData)).rejects.toThrow(
        "L'utilisateur a déjà une entreprise."
      );
    });

    it('devrait échouer si les données obligatoires manquent', async () => {
      const companyData = {
        industry: 'Technologie',
        companyDescription: 'Description de test',
        otherIndustry: null,
      };

      await expect(createCompanyProfile('user-123', companyData)).rejects.toThrow(
        'Erreur lors de la création du profil d\'entreprise'
      );
    });

    it('devrait échouer en cas d\'erreur inattendue', async () => {
      jest.spyOn(Company, 'create').mockRejectedValueOnce(new Error('Erreur de base de données'));

      const companyData = {
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        otherIndustry: null,
      };

      await expect(createCompanyProfile('user-123', companyData)).rejects.toThrow(
        'Erreur lors de la création du profil d\'entreprise: Erreur de base de données'
      );

      jest.spyOn(Company, 'create').mockRestore();
    });
  });

  describe('getCompanyProfile', () => {
    it('devrait récupérer une entreprise avec des départements', async () => {
      const company = await Company.create({
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        user_id: 'user-123',
        otherIndustry: null,
      });

      await Department.bulkCreate([
        { name: 'Ingénierie', company_id: company.id },
        { name: 'Marketing', company_id: company.id },
      ]);

      const result = await getCompanyProfile('user-123');

     expect(result).not.toBeNull();
  expect(result!.companyName).toBe('Entreprise Test');
  expect(result!.departments).toBeDefined(); 
  expect(result!.departments).toHaveLength(2);
  expect(result!.departments!.map((d) => d.name)).toEqual(
    expect.arrayContaining(['Ingénierie', 'Marketing'])
  );
});

    it('devrait renvoyer null si aucune entreprise n\'existe', async () => {
      const result = await getCompanyProfile('user-123');
      expect(result).toBeNull();
    });

    it('devrait échouer en cas d\'erreur inattendue', async () => {
      jest.spyOn(Company, 'findOne').mockRejectedValueOnce(new Error('Erreur de base de données'));

      await expect(getCompanyProfile('user-123')).rejects.toThrow(
        'Erreur lors de la récupération du profil d\'entreprise: Erreur de base de données'
      );

      jest.spyOn(Company, 'findOne').mockRestore();
    });
  });

  describe('updateCompanyProfile', () => {
    it('devrait mettre à jour une entreprise avec des départements', async () => {
      const company = await Company.create({
        companyName: 'Entreprise Initiale',
        industry: 'Technologie',
        companyDescription: 'Description initiale',
        user_id: 'user-123',
        otherIndustry: null,
      });

      await Department.bulkCreate([
        { name: 'Ingénierie', company_id: company.id },
        { name: 'Marketing', company_id: company.id },
      ]);

      const updateData = {
        companyName: 'Entreprise Mise à Jour',
        industry: 'Finance',
        companyDescription: 'Description mise à jour',
        departments: ['RH', 'Finance'],
      };

      const updatedCompany = await updateCompanyProfile('user-123', updateData);
      expect(updatedCompany!.companyName).toBeDefined();
      expect(updatedCompany!.companyName).toBe('Entreprise Mise à Jour');
      expect(updatedCompany!.industry).toBe('Finance');
      expect(updatedCompany!.departments).toHaveLength(2);
      expect(updatedCompany!.departments!.map((d: any) => d.name)).toEqual(
        expect.arrayContaining(['RH', 'Finance'])
      );
    });

    it('devrait mettre à jour une entreprise sans modifier les départements', async () => {
      const company = await Company.create({
        companyName: 'Entreprise Initiale',
        industry: 'Technologie',
        companyDescription: 'Description initiale',
        user_id: 'user-123',
        otherIndustry: null,
      });

      const updateData = {
        companyName: 'Entreprise Mise à Jour',
        industry: 'Finance',
        companyDescription: 'Description mise à jour',
      };

      const updatedCompany = await updateCompanyProfile('user-123', updateData);
      
      expect(updatedCompany!.companyName).toBeDefined();
      expect(updatedCompany!.companyName).toBe('Entreprise Mise à Jour');
      expect(updatedCompany!.industry).toBe('Finance');
      expect(updatedCompany!.departments).toHaveLength(0);
    });

    it('devrait échouer si aucune entreprise n\'existe', async () => {
      const updateData = {
        companyName: 'Entreprise Mise à Jour',
        industry: 'Finance',
        companyDescription: 'Description mise à jour',
      };

      await expect(updateCompanyProfile('user-123', updateData)).rejects.toThrow(
        'Aucune entreprise associée à cet utilisateur.'
      );
    });

    it('devrait échouer en cas d\'erreur inattendue', async () => {
  // Créer une entreprise pour le test
  const companyInstance = await Company.create({
    companyName: 'Entreprise Initiale',
    industry: 'Technologie',
    companyDescription: 'Description initiale',
    user_id: 'user-123',
    otherIndustry: null,
  });

  // Mocker getCompanyByUserId pour renvoyer l'instance avec un update mocké
  jest.spyOn(Company, 'getCompanyByUserId').mockResolvedValueOnce({
    ...companyInstance,
    update: jest.fn().mockRejectedValueOnce(new Error('Erreur de base de données')),
  } as any);

  const updateData = {
    companyName: 'Entreprise Mise à Jour',
    industry: 'Finance',
    companyDescription: 'Description mise à jour',
  };

  await expect(updateCompanyProfile('user-123', updateData)).rejects.toThrow(
    'Erreur lors de la mise à jour du profil d\'entreprise: Erreur de base de données'
  );

  jest.spyOn(Company, 'getCompanyByUserId').mockRestore();
});

});

  describe('hasCompanyProfile', () => {
    it('devrait renvoyer true si une entreprise existe', async () => {
      await Company.create({
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        user_id: 'user-123',
        otherIndustry: null,
      });

      const result = await hasCompanyProfile('user-123');
      expect(result).toBe(true);
    });

    it('devrait renvoyer false si aucune entreprise n\'existe', async () => {
      const result = await hasCompanyProfile('user-123');
      expect(result).toBe(false);
    });

    it('devrait renvoyer false en cas d\'erreur inattendue', async () => {
      jest.spyOn(Company, 'findOne').mockRejectedValueOnce(new Error('Erreur de base de données'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await hasCompanyProfile('user-123');
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur lors de la vérification du profil d\'entreprise:',
        expect.any(Error)
      );

      jest.spyOn(Company, 'findOne').mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});