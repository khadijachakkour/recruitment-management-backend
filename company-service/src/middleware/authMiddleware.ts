import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Accès non autorisé" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token) as { sub: string; realm_access?: { roles?: string[] } };
    if (!decoded || !decoded.sub) {
      res.status(401).json({ message: "Token invalide" });
      return;
    }

    if (!decoded.realm_access?.roles?.includes("Admin")) {
      res.status(403).json({ message: "Accès réservé aux administrateurs" });
      return;
    }

    req.user = { id: decoded.sub };
    next(); // ✅ On passe bien au middleware suivant
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
}
