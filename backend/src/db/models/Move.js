'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

/** @enum {string} */
const PieceColor = Object.freeze({
  WHITE: 'white',
  BLACK: 'black',
});

class Move extends Model {}

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
    timestamps: false,
  },
);

module.exports = { Move, PieceColor };
