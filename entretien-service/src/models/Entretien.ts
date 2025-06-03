import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/dbConfig';

export type EntretienType = 'Visio' | 'Presentiel';
export type EntretienStatut = 'Planifie' | 'Termine' | 'Annule';

export class Entretien extends Model {
  public id!: number;
  public date!: Date;
  public type!: EntretienType;
  public lieu!: string;
  public recruteurId!: string;
  public candidatureId!: string;
  public statut!: EntretienStatut;
  public jitsiUrl?: string;
}

Entretien.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Visio', 'Presentiel'),
      allowNull: false,
    },
    lieu: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
    recruteurId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    candidatureId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM('Planifie', 'Termine', 'Annule'),
      allowNull: false,
    },
    jitsiUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Entretien',
    tableName: 'entretiens',
    timestamps: false,
  }
);
