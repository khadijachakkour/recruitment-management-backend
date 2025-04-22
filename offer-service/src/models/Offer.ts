import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig";

class Offer extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public location!: string;
  public salary?: number;
  public skillsRequired!: string;
  public contractType!: string;
  public departmentId!: number; // Foreign key for Department
  public applicationDeadline!: Date;
  public createdAt?: Date;
  public userId!: string; // Foreign key for Recruiter
  public companyId!: number; // Foreign key for Company
}

Offer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    skillsRequired: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contractType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "offers",
  }
);

export default Offer;