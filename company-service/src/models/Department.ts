import { DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig";
import Company from "./Company";

class Department extends Model {
  public id!: number;
  public name?: string;
  public company_id!: number;   //clé étrangère
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "departments",
  }
);

// Une entreprise peut avoir plusieurs départements.
Company.hasMany(Department, { foreignKey: "company_id", as: "departments" });

//Chaque département appartient à une entreprise
Department.belongsTo(Company, { foreignKey: "company_id", as: "company" });  

export default Department;
