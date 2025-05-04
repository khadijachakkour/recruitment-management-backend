import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig"; 

class Candidature extends Model{
    id!: number;
    offer_id!: number;
    candidate_id!: string;
    cvUrl!: string;
    coverLetterUrl?: string | null;
    status?: "en_attente" | "acceptee" | "refusee";
    date_soumission?: Date;    
}

Candidature.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      offer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      candidate_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cv_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cover_letter_url: {
        type: DataTypes.STRING,
        allowNull: true, 
      },
      status: {
        type: DataTypes.ENUM("en_attente", "acceptee", "refusee"),
        allowNull: false,
        defaultValue: "en_attente",
      },
      date_soumission: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Candidature",
      tableName: "candidatures",
      underscored: true,
      timestamps: false, // désactive les champs automatiques createdAt / updatedAt
      indexes: [
        {
          unique: true,
          fields: ["offer_id", "candidate_id"], // empêche les doublons
        },
      ],
    }
  );
  
  export default Candidature;
  