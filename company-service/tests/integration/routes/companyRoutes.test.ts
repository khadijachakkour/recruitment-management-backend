import request from 'supertest';
import { Server } from 'http';
import app from '../../../src/app';
import sequelize from '../../../src/config/dbConfig';
import Company from '../../../src/models/Company';
import Department from '../../../src/models/Department';
import { authenticateUser } from '../../../src/middleware/authMiddleware';


let originalConsoleError: typeof console.error;

beforeAll(() => {
  originalConsoleError = console.error;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore?.();
  console.error = originalConsoleError;
});


// Mock du middleware d'authentification
jest.mock('../../../src/middleware/authMiddleware', () => ({
  authenticateUser: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }),
}));

// Mock de keycloakService
jest.mock('../../../src/services/keycloakService', () => ({
  authenticateClient: jest.fn().mockResolvedValue(true),
}));

// Mock de Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'mocked_url' }),
    },
  },
}));

let server: Server;

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base réussie');
    await sequelize.sync({ force: true });
    console.log('Synchronisation des tables réussie');
    server = app.listen(0);
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base :", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    server.close();
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture :', error);
  }
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe("Tests d'intégration - Routes Company", () => {
  describe('Configuration de la base de données', () => {
    it('devrait se connecter et synchroniser la base correctement', async () => {
      try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
        const tables = await sequelize.getQueryInterface().showAllTables();
        expect(tables).toContain('companies');
        expect(tables).toContain('departments');
        expect(tables).toContain('user_departments');
      } catch (error) {
        console.error('Erreur dans le test de configuration :', error);
        throw error;
      }
    });
  });

  describe('POST /api/companies/createCompany', () => {
    it("devrait créer un profil d'entreprise avec succès", async () => {
      const companyData = {
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: "Description de test pour l'entreprise",
        otherIndustry: null,
        departments: ['Ingénierie', 'Marketing'],
      };

      const response = await request(app)
        .post('/api/companies/createCompany')
        .send(companyData)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Entreprise créée avec succès.');
      expect(response.body.company).toHaveProperty('id');
      expect(response.body.company.companyName).toBe('Entreprise Test');
      expect(response.body.company.industry).toBe('Technologie');
      expect(response.body.company.user_id).toBe('test-user-id');

      const departments = await Department.findAll({
        where: { company_id: response.body.company.id },
      });
      expect(departments.length).toBe(2);
      expect(departments.map((d) => d.name)).toEqual(
        expect.arrayContaining(['Ingénierie', 'Marketing'])
      );
    });

    it("devrait retourner 401 si l'utilisateur n'est pas authentifié", async () => {
      (authenticateUser as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = undefined;
        next();
      });

      const companyData = {
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        otherIndustry: null,
      };

      const response = await request(app)
        .post('/api/companies/createCompany')
        .send(companyData)
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Utilisateur non authentifié');
    });

    it("devrait retourner 500 si l'utilisateur a déjà une entreprise", async () => {
      await Company.create({
        companyName: 'Entreprise Existante',
        industry: 'Technologie',
        companyDescription: 'Description existante',
        user_id: 'test-user-id',
        otherIndustry: null,
      });

      const companyData = {
        companyName: 'Nouvelle Entreprise',
        industry: 'Technologie',
        companyDescription: 'Nouvelle description',
        otherIndustry: null,
      };

      const response = await request(app)
        .post('/api/companies/createCompany')
        .send(companyData)
        .set('Accept', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("L'utilisateur a déjà une entreprise.");
    });

    it('devrait retourner 500 si les données obligatoires manquent', async () => {
      const companyData = {
        industry: 'Technologie',
        companyDescription: 'Description de test',
        otherIndustry: null,
      };

      const response = await request(app)
        .post('/api/companies/createCompany')
        .send(companyData)
        .set('Accept', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Erreur lors de la création du profil d\'entreprise');
    });

    it("devrait créer une entreprise sans départements", async () => {
      const companyData = {
        companyName: 'Entreprise Sans Départements',
        industry: 'Finance',
        companyDescription: 'Description sans départements',
        otherIndustry: null,
      };

      const response = await request(app)
        .post('/api/companies/createCompany')
        .send(companyData)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Entreprise créée avec succès.');
      expect(response.body.company.companyName).toBe('Entreprise Sans Départements');

      const departments = await Department.findAll({
        where: { company_id: response.body.company.id },
      });
      expect(departments.length).toBe(0);
    });
  });

  // Nouveau block pour GET /api/companies/profile
  describe('GET /api/companies/profile', () => {
    it('devrait récupérer le profil d\'entreprise avec succès', async () => {
      // Créer une entreprise avec des départements
      const company = await Company.create({
        companyName: 'Entreprise Test',
        industry: 'Technologie',
        companyDescription: 'Description de test',
        user_id: 'test-user-id',
        otherIndustry: null,
      });

      await Department.bulkCreate([
        { name: 'Ingénierie', company_id: company.id },
        { name: 'Marketing', company_id: company.id },
      ]);

      const response = await request(app)
        .get('/api/companies/profile')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.companyName).toBe('Entreprise Test');
      expect(response.body.industry).toBe('Technologie');
      expect(response.body.user_id).toBe('test-user-id');
      expect(response.body.departments).toHaveLength(2);
      expect(response.body.departments.map((d: any) => d.name)).toEqual(
        expect.arrayContaining(['Ingénierie', 'Marketing'])
      );
    });

    it('devrait retourner 204 si aucun profil d\'entreprise n\'existe', async () => {
      const response = await request(app)
        .get('/api/companies/profile')
        .set('Accept', 'application/json');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({}); 
    });

    it('devrait retourner 401 si l\'utilisateur n\'est pas authentifié', async () => {
      (authenticateUser as jest.Mock).mockImplementationOnce((req, res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .get('/api/companies/profile')
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Utilisateur non authentifié');
    });

    it('devrait retourner 500 en cas d\'erreur inattendue', async () => {
      // Mock de Company.findOne pour simuler une erreur
      jest.spyOn(Company, 'findOne').mockRejectedValueOnce(new Error('Erreur de base de données'));

      const response = await request(app)
        .get('/api/companies/profile')
        .set('Accept', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Erreur lors de la récupération du profil d'entreprise");
      expect(response.body.message).toContain('Erreur de base de données');

      jest.spyOn(Company, 'findOne').mockRestore();
    });
  });
});