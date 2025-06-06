import axios from "axios";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import * as jwtUtils from "../../../src/utils/jwtUtils";
import * as keycloakService from "../../../src/services/keycloakService";
import * as AdminService from "../../../src/services/AdminService"; // Import du module complet

// Masquer les logs d'erreur pendant les tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock("axios");
jest.mock("nodemailer");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/jwtUtils");
jest.mock("../../../src/services/keycloakService");

describe("adminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCompanyByAdminId", () => {
    it("devrait retourner les données de la société", async () => {
      const mockData = { id: "123", name: "MyCompany" };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await AdminService.getCompanyByAdminId("adminId");
      expect(result).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith("http://localhost:5000/api/companies/by-admin/adminId");
    });

    it("devrait jeter une erreur en cas d'échec", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Erreur réseau"));

      await expect(AdminService.getCompanyByAdminId("adminId")).rejects.toThrow("Impossible de récupérer la company liée à l'admin.");
    });
  });

  describe("createUser", () => {
  it("devrait créer un utilisateur et envoyer un email", async () => {
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("mockToken");

    // Mock getCompanyByAdminId via spyOn pour garantir l'utilisation du mock dans createUser
    jest.spyOn(AdminService, "getCompanyByAdminId").mockResolvedValue({ id: "companyId123" });

    (axios.post as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({ headers: { location: "http://keycloak/users/42" } })) // création user
      .mockImplementationOnce(() => Promise.resolve()); // ajout role

    (axios.get as jest.Mock).mockResolvedValue({ data: { id: "roleId" } });

    (jwtUtils.generateResetToken as jest.Mock).mockReturnValue("resetTokenMock");

    const sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const userData = {
      firstname: "John",
      lastname: "Doe",
      username: "johndoe",
      email: "john@example.com",
      role: "user",
    };

    jest.useFakeTimers();
    const result = await AdminService.createUser(userData, "adminId");
    jest.runAllTimers();
    expect(result).toEqual({ id: "42", resetToken: "resetTokenMock" });
    expect(keycloakService.authenticateClient).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalled();
    expect(jwtUtils.generateResetToken).toHaveBeenCalledWith("42");
    expect(sendMailMock).toHaveBeenCalled();
  });

  it("devrait propager l'erreur si la création échoue", async () => {
    (keycloakService.authenticateClient as jest.Mock).mockRejectedValue(new Error("Erreur auth"));

    await expect(AdminService.createUser({
      firstname: "Test",
      lastname: "User",
      username: "testuser",
      email: "test@example.com",
      role: "user"
    }, "adminId")).rejects.toThrow("Erreur auth");
  });

  it("devrait lever une erreur si headers.location est undefined", async () => {
    (keycloakService.authenticateClient as jest.Mock).mockResolvedValue("mockToken");
    jest.spyOn(AdminService, "getCompanyByAdminId").mockResolvedValue({ id: "companyId123" });

    // headers.location est undefined
    (axios.post as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({ headers: { location: undefined } }));

    const userData = {
      firstname: "Jane",
      lastname: "Smith",
      username: "janesmith",
      email: "jane@example.com",
      role: "user",
    };

    await expect(AdminService.createUser(userData, "adminId"))
      .rejects.toThrow("Utilisateur créé mais ID introuvable.");
  });
});

  describe("getUserIdFromToken", () => {
    it("devrait retourner l'id utilisateur décodé", () => {
      const fakeReq = { headers: { authorization: "Bearer token123" } } as any;
      (jwt.decode as jest.Mock).mockReturnValue({ sub: "userId123" });

      const userId = AdminService.getUserIdFromToken(fakeReq);
      expect(userId).toBe("userId123");
      expect(jwt.decode).toHaveBeenCalledWith("token123");
    });

    it("devrait retourner null si pas d'authorization", () => {
      const fakeReq = { headers: {} } as any;
      const userId = AdminService.getUserIdFromToken(fakeReq);
      expect(userId).toBeNull();
    });

    it("devrait retourner null en cas d'erreur de décodage", () => {
      const fakeReq = { headers: { authorization: "Bearer invalidToken" } } as any;
      (jwt.decode as jest.Mock).mockImplementation(() => { throw new Error("Invalid token"); });

      const userId = AdminService.getUserIdFromToken(fakeReq);
      expect(userId).toBeNull();
    });
  });
});