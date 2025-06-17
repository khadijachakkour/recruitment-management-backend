import * as entretienController from '../../../src/controllers/entretienController';
import * as entretienService from '../../../src/services/entretienService';
import { publishKafkaEvent } from '../../../src/kafkaProducer';
import axios from 'axios';

jest.mock('../../../src/services/entretienService');
jest.mock('../../../src/kafkaProducer');
jest.mock('axios');

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('entretienController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEntretien', () => {
    it('retourne 400 si candidatureId manquant', async () => {
      const req = { body: { candidatId: '1' } } as any;
      const res = mockRes();
      await entretienController.createEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('candidatureId') });
    });

    it('retourne 400 si candidatId manquant', async () => {
      const req = { body: { candidatureId: '1' } } as any;
      const res = mockRes();
      await entretienController.createEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('candidatId') });
    });

    it('retourne 409 si entretien déjà existant', async () => {
      (entretienService.getEntretienByCandidature as jest.Mock).mockResolvedValue({ id: 1 });
      const req = { body: { candidatureId: '1', candidatId: '2' } } as any;
      const res = mockRes();
      await entretienController.createEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('déjà planifié') });
    });

    it('crée un entretien et publie un event', async () => {
      (entretienService.getEntretienByCandidature as jest.Mock).mockResolvedValue(null);
      (entretienService.createEntretien as jest.Mock).mockResolvedValue({ id: 123, date: '2024-01-01', type: 'Visio', lieu: 'Paris' });
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { offer_id: 42 } });
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { title: 'Développeur' } });

      const req = {
        body: {
          candidatureId: '1',
          candidatId: '2',
          recruteurName: 'Jean',
          companyName: 'ACME',
          type: 'Visio',
          lieu: 'Paris'
        }
      } as any;
      const res = mockRes();

      await entretienController.createEntretien(req, res);

      expect(entretienService.createEntretien).toHaveBeenCalled();
      expect(publishKafkaEvent).toHaveBeenCalledWith(
        'entretien_planifie',
        expect.objectContaining({
          candidatureId: '1',
          entretienId: 123,
          offer_title: 'Développeur',
          recruteurName: 'Jean',
          companyName: 'ACME'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 123 }));
    });

    it('retourne 400 en cas d\'erreur', async () => {
      (entretienService.getEntretienByCandidature as jest.Mock).mockRejectedValue(new Error('Erreur'));
      const req = { body: { candidatureId: '1', candidatId: '2' } } as any;
      const res = mockRes();
      await entretienController.createEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur' });
    });
  });

  describe('getEntretienById', () => {
    it('renvoie l\'entretien si trouvé', async () => {
      (entretienService.getEntretienById as jest.Mock).mockResolvedValue({ id: 1 });
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await entretienController.getEntretienById(req, res);
      expect(entretienService.getEntretienById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('renvoie 404 si non trouvé', async () => {
      (entretienService.getEntretienById as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: '999' } } as any;
      const res = mockRes();
      await entretienController.getEntretienById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Entretien non trouvé' });
    });

    it('renvoie 400 en cas d\'erreur', async () => {
      (entretienService.getEntretienById as jest.Mock).mockRejectedValue(new Error('Erreur'));
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      await entretienController.getEntretienById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur' });
    });
  });

  describe('updateEntretien', () => {
    it('met à jour et renvoie l\'entretien', async () => {
      (entretienService.updateEntretien as jest.Mock).mockResolvedValue({ id: 2, lieu: 'Paris' });
      const req = { params: { id: '2' }, body: { lieu: 'Paris' } } as any;
      const res = mockRes();
      await entretienController.updateEntretien(req, res);
      expect(entretienService.updateEntretien).toHaveBeenCalledWith(2, { lieu: 'Paris' });
      expect(res.json).toHaveBeenCalledWith({ id: 2, lieu: 'Paris' });
    });

    it('renvoie 404 si non trouvé', async () => {
      (entretienService.updateEntretien as jest.Mock).mockResolvedValue(null);
      const req = { params: { id: '3' }, body: { lieu: 'Nice' } } as any;
      const res = mockRes();
      await entretienController.updateEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Entretien non trouvé' });
    });

    it('renvoie 400 en cas d\'erreur', async () => {
      (entretienService.updateEntretien as jest.Mock).mockRejectedValue(new Error('Erreur'));
      const req = { params: { id: '2' }, body: { lieu: 'Paris' } } as any;
      const res = mockRes();
      await entretienController.updateEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur' });
    });
  });

  describe('deleteEntretien', () => {
    it('supprime et renvoie un message', async () => {
      (entretienService.deleteEntretien as jest.Mock).mockResolvedValue(1);
      const req = { params: { id: '4' } } as any;
      const res = mockRes();
      await entretienController.deleteEntretien(req, res);
      expect(entretienService.deleteEntretien).toHaveBeenCalledWith(4);
      expect(res.json).toHaveBeenCalledWith({ message: 'Entretien supprimé' });
    });

    it('renvoie 404 si non trouvé', async () => {
      (entretienService.deleteEntretien as jest.Mock).mockResolvedValue(0);
      const req = { params: { id: '5' } } as any;
      const res = mockRes();
      await entretienController.deleteEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Entretien non trouvé' });
    });

    it('renvoie 400 en cas d\'erreur', async () => {
      (entretienService.deleteEntretien as jest.Mock).mockRejectedValue(new Error('Erreur'));
      const req = { params: { id: '4' } } as any;
      const res = mockRes();
      await entretienController.deleteEntretien(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur' });
    });
  });
});