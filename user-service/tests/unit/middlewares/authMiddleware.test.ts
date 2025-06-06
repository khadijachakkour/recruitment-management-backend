import { authenticateUser } from "../../../src/middlewares/authMiddleware";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("authenticateUser middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {}, user: undefined };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("retourne 401 si pas d'Authorization header", () => {
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Accès non autorisé" });
    expect(next).not.toHaveBeenCalled();
  });

  it("retourne 401 si token invalide (decode null)", () => {
    req.headers.authorization = "Bearer faketoken";
    (jwt.decode as jest.Mock).mockReturnValue(null);

    authenticateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalide" });
    expect(next).not.toHaveBeenCalled();
  });

  it("retourne 401 si token sans sub", () => {
    req.headers.authorization = "Bearer faketoken";
    (jwt.decode as jest.Mock).mockReturnValue({});

    authenticateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalide" });
    expect(next).not.toHaveBeenCalled();
  });

  it("retourne 403 si pas le rôle Admin", () => {
    req.headers.authorization = "Bearer faketoken";
    (jwt.decode as jest.Mock).mockReturnValue({
      sub: "user123",
      realm_access: { roles: ["User"] },
    });

    authenticateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Accès réservé aux administrateurs" });
    expect(next).not.toHaveBeenCalled();
  });

  it("passe au middleware suivant si Admin", () => {
    req.headers.authorization = "Bearer faketoken";
    (jwt.decode as jest.Mock).mockReturnValue({
      sub: "admin123",
      realm_access: { roles: ["Admin", "User"] },
    });

    authenticateUser(req, res, next);

    expect(req.user).toEqual({ id: "admin123" });
    expect(next).toHaveBeenCalled();
  });

  it("retourne 401 si une exception est levée", () => {
    req.headers.authorization = "Bearer faketoken";
    (jwt.decode as jest.Mock).mockImplementation(() => { throw new Error("fail"); });

    authenticateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token invalide" });
    expect(next).not.toHaveBeenCalled();
  });
});