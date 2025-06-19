import * as jwtUtils from "../../../src/utils/jwtUtils";
import jwt from "jsonwebtoken";


// Masquer les logs d'erreur pendant les tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

jest.mock("jsonwebtoken");

describe("jwtUtils", () => {
  const userId = "user123";
  const fakeToken = "faketoken";
  const JWT_SECRET = process.env.RESET_PASSWORD_SECRET || "defaultSecret";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateResetToken", () => {
    it("génère un token JWT avec le bon payload et secret", () => {
      (jwt.sign as jest.Mock).mockReturnValue(fakeToken);

      const token = jwtUtils.generateResetToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: userId },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      expect(token).toBe(fakeToken);
    });
  });

  describe("getUserIdFromResetToken", () => {
    it("retourne le userId si le token est valide", () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: userId });

      const result = jwtUtils.getUserIdFromResetToken(fakeToken);

      expect(jwt.verify).toHaveBeenCalledWith(fakeToken, JWT_SECRET);
      expect(result).toBe(userId);
    });

    it("retourne null si le token est invalide ou expiré", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("invalid"); });

      const result = jwtUtils.getUserIdFromResetToken(fakeToken);

      expect(jwt.verify).toHaveBeenCalledWith(fakeToken, JWT_SECRET);
      expect(result).toBeNull();
    });
  });
});