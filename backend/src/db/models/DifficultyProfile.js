'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

/** @enum {string} */
const EngineType = Object.freeze({
  STOCKFISH: 'STOCKFISH',
  AI: 'AI',
});

class DifficultyProfile extends Model {}

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

module.exports = { DifficultyProfile, EngineType };
