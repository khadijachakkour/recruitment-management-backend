"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateUser(req, res, next) {
    var _a, _b;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: "Accès non autorisé" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.sub) {
            res.status(401).json({ message: "Token invalide" });
            return;
        }
        if (!((_b = (_a = decoded.realm_access) === null || _a === void 0 ? void 0 : _a.roles) === null || _b === void 0 ? void 0 : _b.includes("Admin"))) {
            res.status(403).json({ message: "Accès réservé aux administrateurs" });
            return;
        }
        req.user = { id: decoded.sub };
        next(); // ✅ On passe bien au middleware suivant
    }
    catch (error) {
        res.status(401).json({ message: "Token invalide" });
    }
}
