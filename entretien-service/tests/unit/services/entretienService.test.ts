import * as entretienService from '../../../src/services/entretienService';
import { Entretien } from '../../../src/models/Entretien';


beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock('../../../src/models/Entretien');

const mockEntretien = {
  update: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('entretienService', () => {
    describe('createEntretien', () => {
        it('should call Entretien.create with correct data', async () => {
            const data = {
                date: new Date(),
                type: 'TECHNIQUE' as any, 
                lieu: 'Paris',
                recruteurId: 'rec1',
                candidatureId: 'cand1',
                statut: 'EN_ATTENTE' as any, 
                jitsiUrl: 'https://jitsi.test',
            };
            (Entretien.create as jest.Mock).mockResolvedValue('created');
            const result = await entretienService.createEntretien(data);
            expect(Entretien.create).toHaveBeenCalledWith(data);
            expect(result).toBe('created');
        });

        it('should propagate errors from Entretien.create', async () => {
            const data = {
                date: new Date(),
                type: 'TECHNIQUE' as any,
                lieu: 'Paris',
                recruteurId: 'rec1',
                candidatureId: 'cand1',
                statut: 'EN_ATTENTE' as any,
                jitsiUrl: 'https://jitsi.test',
            };
            (Entretien.create as jest.Mock).mockRejectedValue(new Error('DB error'));
            await expect(entretienService.createEntretien(data)).rejects.toThrow('DB error');
        });
    });

    describe('getEntretienById', () => {
        it('should call Entretien.findByPk with id', async () => {
            (Entretien.findByPk as jest.Mock).mockResolvedValue('found');
            const result = await entretienService.getEntretienById(1);
            expect(Entretien.findByPk).toHaveBeenCalledWith(1);
            expect(result).toBe('found');
        });

        it('should return null if not found', async () => {
            (Entretien.findByPk as jest.Mock).mockResolvedValue(null);
            const result = await entretienService.getEntretienById(999);
            expect(result).toBeNull();
        });
    });

    describe('updateEntretien', () => {
        it('should update entretien if found', async () => {
            (Entretien.findByPk as jest.Mock).mockResolvedValue(mockEntretien);
            mockEntretien.update.mockResolvedValue('updated');
            const updates = { lieu: 'Lyon' };
            const result = await entretienService.updateEntretien(2, updates);
            expect(Entretien.findByPk).toHaveBeenCalledWith(2);
            expect(mockEntretien.update).toHaveBeenCalledWith(updates);
            expect(result).toBe('updated');
        });

        it('should return null if entretien not found', async () => {
            (Entretien.findByPk as jest.Mock).mockResolvedValue(null);
            const result = await entretienService.updateEntretien(3, { lieu: 'Nice' });
            expect(result).toBeNull();
        });

        it('should propagate errors from update', async () => {
            (Entretien.findByPk as jest.Mock).mockResolvedValue(mockEntretien);
            mockEntretien.update.mockRejectedValue(new Error('Update error'));
            await expect(entretienService.updateEntretien(2, { lieu: 'Lyon' })).rejects.toThrow('Update error');
        });
    });

    describe('deleteEntretien', () => {
        it('should call Entretien.destroy with correct where clause', async () => {
            (Entretien.destroy as jest.Mock).mockResolvedValue(1);
            const result = await entretienService.deleteEntretien(4);
            expect(Entretien.destroy).toHaveBeenCalledWith({ where: { id: 4 } });
            expect(result).toBe(1);
        });

        it('should return 0 if nothing deleted', async () => {
            (Entretien.destroy as jest.Mock).mockResolvedValue(0);
            const result = await entretienService.deleteEntretien(999);
            expect(result).toBe(0);
        });
    });

    describe('getEntretienByCandidature', () => {
        it('should call Entretien.findOne with candidatureId', async () => {
            (Entretien.findOne as jest.Mock).mockResolvedValue('entretien');
            const result = await entretienService.getEntretienByCandidature('cand2');
            expect(Entretien.findOne).toHaveBeenCalledWith({ where: { candidatureId: 'cand2' } });
            expect(result).toBe('entretien');
        });

        it('should return null if not found', async () => {
            (Entretien.findOne as jest.Mock).mockResolvedValue(null);
            const result = await entretienService.getEntretienByCandidature('notfound');
            expect(result).toBeNull();
        });
    });

    describe('getEntretiensByRecruteur', () => {
        it('should call Entretien.findAll with recruteurId', async () => {
            (Entretien.findAll as jest.Mock).mockResolvedValue(['e1', 'e2']);
            const result = await entretienService.getEntretiensByRecruteur('rec2');
            expect(Entretien.findAll).toHaveBeenCalledWith({ where: { recruteurId: 'rec2' } });
            expect(result).toEqual(['e1', 'e2']);
        });

        it('should return empty array if none found', async () => {
            (Entretien.findAll as jest.Mock).mockResolvedValue([]);
            const result = await entretienService.getEntretiensByRecruteur('none');
            expect(result).toEqual([]);
        });
    });

    describe('getEntretienByJitsiUrl', () => {
        it('should call Entretien.findOne with jitsiUrl', async () => {
            (Entretien.findOne as jest.Mock).mockResolvedValue('entretien');
            const result = await entretienService.getEntretienByJitsiUrl('https://jitsi.url');
            expect(Entretien.findOne).toHaveBeenCalledWith({ where: { jitsiUrl: 'https://jitsi.url' } });
            expect(result).toBe('entretien');
        });

        it('should return null if not found', async () => {
            (Entretien.findOne as jest.Mock).mockResolvedValue(null);
            const result = await entretienService.getEntretienByJitsiUrl('notfound');
            expect(result).toBeNull();
        });
    });
});