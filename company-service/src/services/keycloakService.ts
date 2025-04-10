import jwt from "jsonwebtoken";
import { Request } from "express";

export function getUserIdFromToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
  
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.decode(token) as { sub: string };
      return decoded?.sub || null;
    } catch (error) {
      console.error("Erreur de décodage du token:", error);
      return null;
    }


}