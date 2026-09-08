import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum EngineType {
  STOCKFISH = 'STOCKFISH',
  AI = 'AI',
}

// ── Atributos ────────────────────────────────────────────────────────────────

interface DifficultyProfileAttributes {
  id: string;
  name: string;            // Principiante | Intermedio | Avanzado | Experto
  engineType: EngineType;
  skillLevel: number;      // Stockfish Skill Level (0–20)
  searchDepth: number;     // Profundidad de búsqueda
  timeLimitMs: number;     // Tiempo máximo por jugada en ms
}

type DifficultyProfileCreationAttributes = Optional<DifficultyProfileAttributes, 'id'>;

// ── Modelo ───────────────────────────────────────────────────────────────────

export class DifficultyProfile
  extends Model<DifficultyProfileAttributes, DifficultyProfileCreationAttributes>
  implements DifficultyProfileAttributes
{
  declare id: string;
  declare name: string;
  declare engineType: EngineType;
  declare skillLevel: number;
  declare searchDepth: number;
  declare timeLimitMs: number;
}

DifficultyProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    engineType: {
      type: DataTypes.ENUM(...Object.values(EngineType)),
      allowNull: false,
      field: 'engine_type',
    },
    skillLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'skill_level',
    },
    searchDepth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'search_depth',
    },
    timeLimitMs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'time_limit_ms',
    },
  },
  {
    sequelize,
    tableName: 'difficulty_profiles',
    underscored: true,
    timestamps: false,
  },
);
