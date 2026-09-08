'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

// ── Constantes de dominio ────────────────────────────────────────────────────

/** @enum {string} */
const GameMode = Object.freeze({
  PVP: 'PVP',
  PV_STOCKFISH: 'PV_STOCKFISH',
  PV_AI: 'PV_AI',
});

/** @enum {string} */
const PlayerType = Object.freeze({
  HUMAN: 'HUMAN',
  STOCKFISH: 'STOCKFISH',
  AI: 'AI',
});

/** @enum {string} */
const GameResult = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  WHITE_WINS: 'WHITE_WINS',
  BLACK_WINS: 'BLACK_WINS',
  DRAW: 'DRAW',
});

// ── Modelo ───────────────────────────────────────────────────────────────────

class Game extends Model {}

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

module.exports = { Game, GameMode, PlayerType, GameResult };
