import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black',
}

// ── Atributos ────────────────────────────────────────────────────────────────

interface MoveAttributes {
  id: string;
  gameId: string;
  moveNumber: number;
  color: PieceColor;
  san: string;       // Ej: "e4", "Nf3", "O-O"
  fenBefore: string; // FEN antes de la jugada
  fenAfter: string;  // FEN después de la jugada
  evalScore: number | null; // Evaluación del motor (opcional)
  timeSpentMs: number;
  createdAt: Date;
}

type MoveCreationAttributes = Optional<
  MoveAttributes,
  'id' | 'evalScore' | 'createdAt'
>;

// ── Modelo ───────────────────────────────────────────────────────────────────

export class Move
  extends Model<MoveAttributes, MoveCreationAttributes>
  implements MoveAttributes
{
  declare id: string;
  declare gameId: string;
  declare moveNumber: number;
  declare color: PieceColor;
  declare san: string;
  declare fenBefore: string;
  declare fenAfter: string;
  declare evalScore: number | null;
  declare timeSpentMs: number;
  declare createdAt: Date;
}

Move.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'game_id',
      references: { model: 'games', key: 'id' },
      onDelete: 'CASCADE',
    },
    moveNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'move_number',
    },
    color: {
      type: DataTypes.ENUM(...Object.values(PieceColor)),
      allowNull: false,
    },
    san: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fenBefore: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'fen_before',
    },
    fenAfter: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'fen_after',
    },
    evalScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'eval_score',
    },
    timeSpentMs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'time_spent_ms',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'moves',
    underscored: true,
    timestamps: false, // manejamos createdAt manualmente
  },
);
