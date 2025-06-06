import * as userController from "../../../src/controllers/userController";
import * as keycloakService from "../../../src/services/keycloakService";
import UserProfile from "../../../src/models/CandidatProfile";
import axios from "axios";

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});
jest.mock("axios");
jest.mock("../../../src/services/keycloakService");
jest.mock("../../../src/services/AdminService");
jest.mock("../../../src/models/CandidatProfile");

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("userController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerCandidat", () => {
    it("inscrit un candidat avec succès", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockResolvedValue({ id: "kc123" });
      (UserProfile.create as jest.Mock).mockResolvedValue({});
      const req = { body: { firstname: "A", lastname: "B", username: "ab", email: "a@b.com", password: "pass" } } as any;
      const res = mockRes();

      await userController.registerCandidat(req, res);

      expect(keycloakService.createUserInKeycloak).toHaveBeenCalled();
      expect(UserProfile.create).toHaveBeenCalledWith({ user_id: "kc123" });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "Candidat inscrit avec succès", user_id: "kc123" });
    });

    it("retourne 500 si erreur Keycloak", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockResolvedValue(null);
      const req = { body: {} } as any;
      const res = mockRes();

      await userController.registerCandidat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Erreur lors de la création de l'utilisateur dans Keycloak") }));
    });

    it("retourne 500 si exception", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockRejectedValue(new Error("fail"));
      const req = { body: {} } as any;
      const res = mockRes();

      await userController.registerCandidat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur d'inscription du candidat" }));
    });
  });

  describe("registerAdmin", () => {
    it("inscrit un admin avec succès", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockResolvedValue({ id: "kc456" });
      (UserProfile.create as jest.Mock).mockResolvedValue({});
      const req = { body: { firstname: "A", lastname: "B", username: "ab", email: "a@b.com", password: "pass" } } as any;
      const res = mockRes();

      await userController.registerAdmin(req, res);

      expect(keycloakService.createUserInKeycloak).toHaveBeenCalled();
      expect(UserProfile.create).toHaveBeenCalledWith({ user_id: "kc456" });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "Admin inscrit avec succès", user_id: "kc456" });
    });

    it("retourne 500 si erreur Keycloak", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockResolvedValue(null);
      const req = { body: {} } as any;
      const res = mockRes();

      await userController.registerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Erreur lors de la création de l'utilisateur dans Keycloak") }));
    });

    it("retourne 500 si exception", async () => {
      (keycloakService.createUserInKeycloak as jest.Mock).mockRejectedValue(new Error("fail"));
      const req = { body: {} } as any;
      const res = mockRes();

      await userController.registerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Erreur d'inscription du admin" }));
    });
  });

  describe("loginWithEmail", () => {
    it("retourne 400 si email ou password manquant", async () => {
      const req = { body: {} } as any;
      const res = mockRes();

      await userController.loginWithEmail(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email et mot de passe sont requis." });
    });

    it("retourne 200 et tokens si succès", async () => {
      const req = { body: { email: "a@b.com", password: "pass" } } as any;
      const res = mockRes();
      (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: "at", refresh_token: "rt" } });

      await userController.loginWithEmail(req, res, jest.fn());

      expect(res.cookie).toHaveBeenCalledWith("refresh_token", "rt", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ access_token: "at" });
    });

    it("retourne 500 si erreur inconnue", async () => {
      const req = { body: { email: "a@b.com", password: "pass" } } as any;
      const res = mockRes();
      (axios.post as jest.Mock).mockRejectedValue(new Error("fail"));

      await userController.loginWithEmail(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur interne du serveur." });
    });
  });

  describe("refreshToken", () => {
  it("retourne 401 si aucun refresh_token", async () => {
    const req = { cookies: {} } as any;
    const res = mockRes();

    await userController.refreshToken(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
  });

  it("renvoie un nouveau access_token et refresh_token", async () => {
    const req = { cookies: { refresh_token: "valid" } } as any;
    const res = mockRes();
    (axios.post as jest.Mock).mockResolvedValue({
      data: { access_token: "newAccess", refresh_token: "newRefresh" },
    });

    await userController.refreshToken(req, res, jest.fn());

    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "newRefresh",
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ access_token: "newAccess" });
  });

  it("retourne 401 si refresh_token expiré", async () => {
    const req = { cookies: { refresh_token: "expired" } } as any;
    const res = mockRes();

    (axios.post as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { error: "invalid_grant" },
      },
    });

    jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
    await userController.refreshToken(req, res, jest.fn());

    expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", { path: "/" });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Session expirée, veuillez vous reconnecter." });
  });

  it("retourne 500 si une autre erreur survient", async () => {
    const req = { cookies: { refresh_token: "valid" } } as any;
    const res = mockRes();

    (axios.post as jest.Mock).mockRejectedValue(new Error("server error"));

    await userController.refreshToken(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur interne du serveur." });
  });
});

describe("getUsers", () => {
  it("retourne 401 si adminId est manquant", async () => {
    const req = {} as any;
    const res = mockRes();
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("token");
    (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);

    await userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalide ou manquant" });
  });

  it("retourne la liste filtrée des utilisateurs", async () => {
    const req = {} as any;
    const res = mockRes();
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("token");
    (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("adminId");

    const users = [
      { id: "u1", attributes: { IdAdmin: ["adminId"] }, username: "user1" },
      { id: "u2", attributes: { IdAdmin: ["other"] }, username: "user2" }
    ];
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: users }) // users
      .mockResolvedValueOnce({ data: [{ name: "user" }] }) // roles for u1
      .mockResolvedValueOnce({ data: ["dep1"] }); // departments for u1

    await userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: "u1",
        attributes: { IdAdmin: ["adminId"] },
        username: "user1",
        role: ["user"],
        departments: ["dep1"]
      }
    ]);
  });

  it("retourne 500 en cas d'erreur", async () => {
    const req = {} as any;
    const res = mockRes();
    (keycloakService.authenticateClient as jest.Mock).mockRejectedValue(new Error("fail"));

    await userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de la récupération filtrée des utilisateurs" });
  });
});

describe("deleteUser", () => {
  it("supprime un utilisateur avec succès", async () => {
    const req = { params: { userId: "u1" } } as any;
    const res = mockRes();
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("token");
    (axios.delete as jest.Mock).mockResolvedValue({});

    await userController.deleteUser(req, res);

    expect(axios.delete).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur supprimé avec succès" });
  });

  it("retourne 500 en cas d'erreur", async () => {
    const req = { params: { userId: "u1" } } as any;
    const res = mockRes();
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("token");
    (axios.delete as jest.Mock).mockRejectedValue(new Error("fail"));

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erreur lors de la suppression de l'utilisateur" });
  });
});

describe("getCurrentUserId", () => {
  it("retourne l'id utilisateur si authentifié", async () => {
    (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue("user123");
    const req = {} as any;
    const res = mockRes();

    await userController.getCurrentUserId(req, res);

    expect(res.json).toHaveBeenCalledWith({ userId: "user123" });
  });

  it("retourne 401 si non authentifié", async () => {
    (keycloakService.getUserIdFromToken as jest.Mock).mockReturnValue(null);
    const req = {} as any;
    const res = mockRes();

    await userController.getCurrentUserId(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });
});

});