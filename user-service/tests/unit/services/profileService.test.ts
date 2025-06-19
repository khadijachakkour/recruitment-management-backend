import * as profileService from "../../../src/services/profileService";
import UserProfile from "../../../src/models/CandidatProfile";

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock("../../../src/models/CandidatProfile");

describe("profileService", () => {
  const mockProfile: any = {
    user_id: "user123",
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    cv_url: null,
    avatar_url: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserProfile", () => {
    it("devrait retourner le profil si trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      const result = await profileService.getUserProfile("user123");
      expect(result).toBe(mockProfile);
      expect(UserProfile.findOne).toHaveBeenCalledWith({ where: { user_id: "user123" } });
    });

    it("devrait lever une erreur si le profil n'est pas trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(null);
      await expect(profileService.getUserProfile("user123")).rejects.toThrow("Profil non trouvé");
    });
  });

  describe("updateUserProfile", () => {
    it("devrait mettre à jour le profil si trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      const data = { firstname: "Alice" };
      const result = await profileService.updateUserProfile("user123", data);
      expect(mockProfile.update).toHaveBeenCalledWith(data);
      expect(result).toBe(mockProfile);
    });

    it("devrait lever une erreur si le profil n'est pas trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(null);
      await expect(profileService.updateUserProfile("user123", {})).rejects.toThrow("Profil non trouvé");
    });
  });

  describe("saveCvUrl", () => {
    it("devrait enregistrer l'URL du CV", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      await profileService.saveCvUrl("user123", "cv.pdf");
      expect(mockProfile.cv_url).toBe("cv.pdf");
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it("devrait lever une erreur si le profil n'est pas trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(null);
      await expect(profileService.saveCvUrl("user123", "cv.pdf")).rejects.toThrow("Profil non trouvé");
    });
  });

  describe("saveAvatarUrl", () => {
    it("devrait enregistrer l'URL de l'avatar", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(mockProfile);
      await profileService.saveAvatarUrl("user123", "avatar.png");
      expect(mockProfile.avatar_url).toBe("avatar.png");
      expect(mockProfile.save).toHaveBeenCalled();
    });

    it("devrait lever une erreur si le profil n'est pas trouvé", async () => {
      (UserProfile.findOne as jest.Mock).mockResolvedValue(null);
      await expect(profileService.saveAvatarUrl("user123", "avatar.png")).rejects.toThrow("Profil non trouvé");
    });
  });
});