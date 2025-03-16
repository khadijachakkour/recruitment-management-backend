"use strict";
/*import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database";

interface UserAttributes {
  id?: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  //role: "Admin" | "Candidat" | "Recruteur" | "Manager" | "RH";
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public firstname!: string;
  public lastname!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  //public role!: "Admin" | "Candidat" | "Recruteur" | "Manager" | "RH";
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /*role: {
      type: DataTypes.ENUM("Admin", "Candidat", "Recruteur", "Manager", "RH"),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);

export default User;
*/ 
