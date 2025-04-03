"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dbConfig_1 = __importDefault(require("../config/dbConfig")); // Le fichier de configuration de Sequelize
// Définir le modèle UserProfile
class UserProfile extends sequelize_1.Model {
}
UserProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true, // Chaque utilisateur peut avoir un seul profil
    },
    phone_number: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    experience: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    education_level: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    skills: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    cv_url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: dbConfig_1.default, // Instance de Sequelize
    modelName: "UserProfile", // Nom du modèle
    tableName: "user_profiles", // Nom de la table
    underscored: true, // Utilisation du snake_case pour les noms de colonnes
});
exports.default = UserProfile;
