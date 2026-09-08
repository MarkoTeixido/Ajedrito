import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum GameMode {
  PVP = 'PVP',
  PV_STOCKFISH = 'PV_STOCKFISH',
  PV_AI = 'PV_AI',
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  STOCKFISH = 'STOCKFISH',
  AI = 'AI',
}

export enum GameResult {
  IN_PROGRESS = 'IN_PROGRESS',
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}

// ── Atributos ────────────────────────────────────────────────────────────────

interface GameAttributes {
  id: string;
  mode: GameMode;
  whiteType: PlayerType;
  blackType: PlayerType;
  difficultyProfileId: string | null;
  result: GameResult;
  startedAt: Date;
  endedAt: Date | null;
}

// Los campos con defaults no son obligatorios en la creación
type GameCreationAttributes = Optional<
  GameAttributes,
  'id' | 'result' | 'startedAt' | 'endedAt' | 'difficultyProfileId'
>;

// ── Modelo ───────────────────────────────────────────────────────────────────

export class Game
  extends Model<GameAttributes, GameCreationAttributes>
  implements GameAttributes
{
  declare id: string;
  declare mode: GameMode;
  declare whiteType: PlayerType;
  declare blackType: PlayerType;
  declare difficultyProfileId: string | null;
  declare result: GameResult;
  declare startedAt: Date;
  declare endedAt: Date | null;
}

Game.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mode: {
      type: DataTypes.ENUM(...Object.values(GameMode)),
      allowNull: false,
    },
    whiteType: {
      type: DataTypes.ENUM(...Object.values(PlayerType)),
      allowNull: false,
      field: 'white_type',
    },
    blackType: {
      type: DataTypes.ENUM(...Object.values(PlayerType)),
      allowNull: false,
      field: 'black_type',
    },
    difficultyProfileId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'difficulty_profile_id',
    },
    result: {
      type: DataTypes.ENUM(...Object.values(GameResult)),
      allowNull: false,
      defaultValue: GameResult.IN_PROGRESS,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'started_at',
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at',
    },
  },
  {
    sequelize,
    tableName: 'games',
    underscored: true,
    timestamps: false,
  },
);
