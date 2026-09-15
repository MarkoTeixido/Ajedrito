'use strict';

/**
 * Punto de entrada de los modelos Sequelize.
 * Importar siempre desde aquí para garantizar que las asociaciones estén cargadas.
 */
const { Game, GameMode, PlayerType, GameResult, GameSource } = require('./Game');
const { Move, PieceColor } = require('./Move');
const { DifficultyProfile, EngineType } = require('./DifficultyProfile');
const { AIModelVersion } = require('./AIModelVersion');

// ── Asociaciones ─────────────────────────────────────────────────────────────

Game.hasMany(Move, { foreignKey: 'gameId', as: 'moves', onDelete: 'CASCADE' });
Move.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

Game.belongsTo(DifficultyProfile, { foreignKey: 'difficultyProfileId', as: 'difficultyProfile' });
DifficultyProfile.hasMany(Game, { foreignKey: 'difficultyProfileId', as: 'games' });

module.exports = {
  Game,
  GameMode,
  PlayerType,
  GameResult,
  GameSource,
  Move,
  PieceColor,
  DifficultyProfile,
  EngineType,
  AIModelVersion,
};
