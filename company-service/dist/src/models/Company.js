"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/Company.ts
const sequelize_1 = require("sequelize");
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
class Company extends sequelize_1.Model {
    static getCompanyByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.findOne({ where: { user_id: userId } });
        });
    }
}
Company.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    companyLogo: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    industry: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    otherIndustry: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    companyDescription: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    companyAddress: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    country: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    region: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    yearFounded: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    companySize: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    numberOfEmployees: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    departments: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    contractTypes: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    requiredDocuments: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    contactEmail: { type: sequelize_1.DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phoneNumber: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    website: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    socialLinks: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    user_id: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
}, {
    sequelize: dbConfig_1.default,
    tableName: "companies",
});
exports.default = Company;
