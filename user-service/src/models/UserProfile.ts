import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig"; // Le fichier de configuration de Sequelize

// Définir le modèle UserProfile
class UserProfile extends Model {
  public id!: number;
  public user_id!: string; // ID de l'utilisateur de Keycloak
  public phone_number!: string;
  public address!: string;
  public experience!: string;
  public education_level!: string;
  public skills!: string;
  public cv_url!: string;
}

UserProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Chaque utilisateur peut avoir un seul profil
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    education_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cv_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
  },
  {
    sequelize, // Instance de Sequelize
    modelName: "UserProfile", // Nom du modèle
    tableName: "user_profiles", // Nom de la table
    underscored: true, // Utilisation du snake_case pour les noms de colonnes
  }
);

export default UserProfile;
