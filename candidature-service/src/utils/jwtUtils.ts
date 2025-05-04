import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.RESET_PASSWORD_SECRET || "defaultSecret";

export function generateResetToken(userId: string): string {
  return jwt.sign(
    { sub: userId }, // sub = subject (standard claim)
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function getUserIdFromResetToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch (error) {
    console.error("Token invalide ou expiré :", error);
    return null;
  }
}
