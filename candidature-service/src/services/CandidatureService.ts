import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request } from "express";


dotenv.config();

export function getUserIdFromToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
  
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("Invalid Authorization header format");
      return null;
    }
  
    const token = parts[1];
    try {
      const decoded = jwt.decode(token) as { sub: string };
      return decoded?.sub || null;
    } catch (error) {
      console.error("Erreur de décodage du token:", error);
      return null;
    }
  }