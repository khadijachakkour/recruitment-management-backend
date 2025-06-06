import * as profileController from "../../../src/controllers/profileController";
import * as profileService from "../../../src/services/profileService";
import * as keycloakService from "../../../src/services/keycloakService";
import cloudinary from "../../../src/utils/cloudinary";
import streamifier from "streamifier";

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock("../../../src/services/profileService");
jest.mock("../../../src/services/keycloakService");
jest.mock("../../../src/utils/cloudinary");
jest.mock("streamifier");

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("profileController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("retourne le profil si authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ id: "user123", name: "Alice" });
      const req = {} as any;
      const res = mockRes();

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "user123", name: "Alice" });
    });

    it("retourne 401 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = {} as any;
      const res = mockRes();

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = {} as any;
      const res = mockRes();

      await profileController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur lors de la récupération du profil" }));
    });
  });

  describe("updateProfile", () => {
    it("met à jour le profil si authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.updateUserProfile as jest.Mock).mockResolvedValue({ id: "user123", name: "Bob" });
      const req = { body: { name: "Bob" } } as any;
      const res = mockRes();

      await profileController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "user123", name: "Bob" });
    });

    it("retourne 401 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = { body: {} } as any;
      const res = mockRes();

      await profileController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.updateUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = { body: {} } as any;
      const res = mockRes();

      await profileController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur lors de la mise à jour du profil" }));
    });
  });

  describe("uploadCv", () => {
    it("retourne 401 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = {} as any;
      const res = mockRes();

      await profileController.uploadCv(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
    });

    it("retourne 400 si aucun fichier reçu", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      const req = { file: undefined } as any;
      const res = mockRes();

      await profileController.uploadCv(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Aucun fichier reçu" });
    });

    it("retourne 200 et sauvegarde le CV", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ cv_url: null });
      (profileService.saveCvUrl as jest.Mock).mockResolvedValue(undefined);

      // Mock du stream Cloudinary
      const uploadStreamMock = jest.fn((_opts, cb) => {
        cb(null, { secure_url: "https://cloudinary.com/cv.pdf" });
        return { end: jest.fn(), on: jest.fn() };
      });
      (cloudinary.uploader.upload_stream as any) = uploadStreamMock;
      (streamifier.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

      const req = { file: { buffer: Buffer.from("test") } } as any;
      const res = mockRes();

      await profileController.uploadCv(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ cv_url: "https://cloudinary.com/cv.pdf" });
      expect(profileService.saveCvUrl).toHaveBeenCalledWith("user123", "https://cloudinary.com/cv.pdf");
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = { file: { buffer: Buffer.from("test") } } as any;
      const res = mockRes();

      await profileController.uploadCv(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur lors de l'upload du CV" }));
    });
  });

  describe("uploadAvatar", () => {
    it("retourne 400 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = {} as any;
      const res = mockRes();

      await profileController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Données manquantes" });
    });

    it("retourne 200 et sauvegarde l'avatar", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ avatar_url: null });
      (profileService.saveAvatarUrl as jest.Mock).mockResolvedValue(undefined);

      const uploadStreamMock = jest.fn((_opts, cb) => {
        cb(null, { secure_url: "https://cloudinary.com/avatar.png" });
        return { end: jest.fn(), on: jest.fn() };
      });
      (cloudinary.uploader.upload_stream as any) = uploadStreamMock;
      (streamifier.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

      const req = { file: { buffer: Buffer.from("test") } } as any;
      const res = mockRes();

      await profileController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ avatar_url: "https://cloudinary.com/avatar.png" });
      expect(profileService.saveAvatarUrl).toHaveBeenCalledWith("user123", "https://cloudinary.com/avatar.png");
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = { file: { buffer: Buffer.from("test") } } as any;
      const res = mockRes();

      await profileController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur lors de l’upload de l’avatar" }));
    });
  });

  describe("deleteAvatar", () => {
    it("retourne 401 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
    });

    it("retourne 400 si aucun avatar à supprimer", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ avatar_url: null });
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Aucun avatar à supprimer." });
    });

    it("retourne 200 si suppression réussie", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ avatar_url: "https://cloudinary.com/avatar.png" });
      (profileService.saveAvatarUrl as jest.Mock).mockResolvedValue(undefined);
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: "ok" });

      const req = {} as any;
      const res = mockRes();

      await profileController.deleteAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Avatar supprimé avec succès" });
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur suppression avatar" }));
    });
  });

  describe("deleteCv", () => {
    it("retourne 401 si non authentifié", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteCv(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur non authentifié" });
    });

    it("retourne 400 si aucun CV à supprimer", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ cv_url: null });
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteCv(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Aucun CV à supprimer." });
    });

    it("retourne 200 si suppression réussie", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockResolvedValue({ cv_url: "https://cloudinary.com/cv.pdf" });
      (profileService.saveCvUrl as jest.Mock).mockResolvedValue(undefined);
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: "ok" });

      const req = {} as any;
      const res = mockRes();

      await profileController.deleteCv(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "CV supprimé avec succès" });
    });

    it("retourne 500 en cas d'erreur", async () => {
      (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
      (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error("Erreur"));
      const req = {} as any;
      const res = mockRes();

      await profileController.deleteCv(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur suppression CV" }));
    });
  });
});