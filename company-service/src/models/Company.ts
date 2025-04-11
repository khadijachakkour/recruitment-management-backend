import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig";
import Department from "./Department";

class Company extends Model {
  public id!: number;
  public companyName!: string;
  public companyLogo?: string;
  public industry!: string; //secteur d'activité
  public otherIndustry?: string;
  public companyDescription!: string;
  public companyAddress!: string;
  public country!: string;
  public region!: string;
  public yearFounded!: string;
  public companySize!: string;
  public numberOfEmployees!: string;
  public contractTypes!: string;
  public requiredDocuments!: string;
  public contactEmail!: string;
  public phoneNumber!: string;
  public website?: string;
  public socialLinks?: string;
  public user_id!: string;
  public ceo?: string;
  public revenue?: number;  // Ici, on définit correctement le champ revenue.

  static async getCompanyByUserId(userId: string) {
    return await this.findOne({ where: { user_id: userId } });
  }
}

Company.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: DataTypes.STRING, allowNull: false },
    companyLogo: { type: DataTypes.STRING, allowNull: true },
    industry: { type: DataTypes.STRING, allowNull: false },
    otherIndustry: { type: DataTypes.STRING, allowNull: true },
    companyDescription: { type: DataTypes.TEXT, allowNull: false },
    companyAddress: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
    region: { type: DataTypes.STRING, allowNull: false },
    yearFounded: { type: DataTypes.STRING, allowNull: false },
    companySize: { type: DataTypes.STRING, allowNull: false },
    numberOfEmployees: { type: DataTypes.STRING, allowNull: false },
    contractTypes: { type: DataTypes.STRING, allowNull: false },
    requiredDocuments: { type: DataTypes.STRING, allowNull: false },
    contactEmail: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    website: { type: DataTypes.STRING, allowNull: true },
    socialLinks: { type: DataTypes.STRING, allowNull: true },
    user_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    revenue:{ type: DataTypes.STRING, allowNull: true},

  },
  {
    sequelize,
    tableName: "companies",
    indexes: [{ unique: true, fields: ["user_id"] }],
  }
);

export default Company;
