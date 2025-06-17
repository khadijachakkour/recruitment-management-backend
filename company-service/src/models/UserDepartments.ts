import { Association, DataTypes, Model } from "sequelize";
import sequelize from "../config/dbConfig";
import Department from "./Department";

class UserDepartments extends Model {
    public id!: number;
    public user_id!: string; 
    public department_id!: number; 

    public Department?: Department; 
    static async deleteByUserId(userId: string): Promise<void> {
      await UserDepartments.destroy({
          where: { user_id: userId },
      });
  }

  public static associations: {
    department: Association<UserDepartments, Department>;
};
}


UserDepartments.init(
  {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Department,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "user_departments",
  }
);
UserDepartments.belongsTo(Department, { foreignKey: "department_id", as: "Department" });
export default UserDepartments;