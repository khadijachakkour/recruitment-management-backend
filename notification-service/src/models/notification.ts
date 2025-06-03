import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig";

export class Notification extends Model {
  public id!: number;
  public candidatId!: string;
  public message!: string;
  public createdAt!: Date;
  public read!: boolean;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    candidatId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: false,
    indexes: [
      {
        fields: ['candidatId'],
      },
    ],
  }
);

export default Notification;