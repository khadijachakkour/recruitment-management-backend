import axios from "axios";
import jwt from "jsonwebtoken";
import * as keycloakService from "../../../src/services/keycloakService";
import { Request } from "express";

// Masquer les logs d'erreur pendant les tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock("axios");
jest.mock("jsonwebtoken");

describe("keycloakService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KEYCLOAK_SERVER_URL = "http://keycloak";
    process.env.KEYCLOAK_REALM = "myrealm";
    process.env.KEYCLOAK_CLIENT_ID = "client";
    process.env.KEYCLOAK_CLIENT_SECRET = "secret";
  });

  describe("authenticateClient", () => {
    it("doit retourner un access_token si succès", async () => {
      (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: "token123" } });
      const token = await keycloakService.authenticateClient();
      expect(token).toBe("token123");
      expect(axios.post).toHaveBeenCalled();
    });

    it("doit lancer une erreur si l'appel échoue", async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error("Erreur auth"));
      await expect(keycloakService.authenticateClient()).rejects.toThrow("Erreur auth");
    });
  });

  describe("createUserInKeycloak", () => {
   // Test succès
it("doit créer un utilisateur, assigner un rôle et retourner l'id", async () => {
  (axios.post as jest.Mock)
    .mockImplementationOnce(() => Promise.resolve({ data: { access_token: "token123" } })) // authentification
    .mockImplementationOnce(() => Promise.resolve({ headers: { location: "http://keycloak/users/42" } })) // création user
    .mockImplementationOnce(() => Promise.resolve()); // assignation rôle

  (axios.get as jest.Mock).mockResolvedValue({ data: { id: "roleId", name: "user" } });

  const userData = {
    firstname: "John",
    lastname: "Doe",
    username: "johndoe",
    email: "john@example.com",
    password: "pass",
    role: "user",
  };

  const result = await keycloakService.createUserInKeycloak(userData);
  expect(result).toEqual({ id: "42" });
  expect(axios.post).toHaveBeenCalledTimes(3);
  expect(axios.get).toHaveBeenCalled();
});

// Test headers.location undefined
it("doit lever une erreur si headers.location est undefined", async () => {
  (axios.post as jest.Mock)
    .mockImplementationOnce(() => Promise.resolve({ data: { access_token: "token123" } })) // authentification
    .mockImplementationOnce(() => Promise.resolve({ headers: { location: undefined } })); // création user

  const userData = {
    firstname: "Jane",
    lastname: "Smith",
    username: "janesmith",
    email: "jane@example.com",
    password: "pass",
    role: "user",
  };

  await expect(keycloakService.createUserInKeycloak(userData))
    .rejects.toThrow("Utilisateur créé mais ID introuvable.");
});

it("doit lever une erreur si la récupération du rôle échoue", async () => {
  (axios.post as jest.Mock)
    .mockImplementationOnce(() => Promise.resolve({ data: { access_token: "token123" } })) // auth
    .mockImplementationOnce(() => Promise.resolve({ headers: { location: "http://keycloak/users/123" } })); // user created

  (axios.get as jest.Mock).mockRejectedValue(new Error("Erreur rôle"));

  const userData = {
    firstname: "John",
    lastname: "Doe",
    username: "johndoe",
    email: "john@example.com",
    password: "pass",
    role: "admin",
  };

  await expect(keycloakService.createUserInKeycloak(userData))
    .rejects.toThrow("Erreur rôle");
});


    it("doit lever une erreur si une étape échoue", async () => {
  (axios.post as jest.Mock)
    .mockImplementationOnce(() => Promise.resolve({ data: { access_token: "token123" } })) // authentification
    .mockImplementationOnce(() => { throw new Error("Erreur création"); }); // création user échoue

  const userData = {
    firstname: "Jane",
    lastname: "Smith",
    username: "janesmith",
    email: "jane@example.com",
    password: "pass",
    role: "user",
  };

  await expect(keycloakService.createUserInKeycloak(userData))
    .rejects.toThrow("Erreur création");
});
  });

  describe("getUserIdFromToken", () => {
    it("doit retourner l'id utilisateur décodé", () => {
      const fakeReq = { headers: { authorization: "Bearer token123" } } as Request;
      (jwt.decode as jest.Mock).mockReturnValue({ sub: "userId123" });

      const userId = keycloakService.getUserIdFromToken(fakeReq);
      expect(userId).toBe("userId123");
      expect(jwt.decode).toHaveBeenCalledWith("token123");
    });

    it("doit retourner null si pas d'authorization", () => {
      const fakeReq = { headers: {} } as Request;
      const userId = keycloakService.getUserIdFromToken(fakeReq);
      expect(userId).toBeNull();
    });

    it("doit retourner null si le format du header est invalide", () => {
      const fakeReq = { headers: { authorization: "BadFormat" } } as Request;
      const userId = keycloakService.getUserIdFromToken(fakeReq);
      expect(userId).toBeNull();
    });

    it("doit retourner null en cas d'erreur de décodage", () => {
      const fakeReq = { headers: { authorization: "Bearer invalidToken" } } as Request;
      (jwt.decode as jest.Mock).mockImplementation(() => { throw new Error("Invalid token"); });

      const userId = keycloakService.getUserIdFromToken(fakeReq);
      expect(userId).toBeNull();
    });
  });
});