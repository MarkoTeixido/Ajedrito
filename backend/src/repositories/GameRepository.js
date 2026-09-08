'use strict';

const { Game, GameResult, PlayerType } = require('../db/models/Game');

/**
 * Repository para la entidad Game.
 * Encapsula toda interacción de Sequelize con la tabla games.
 */
class GameRepository {
  /**
   * @param {{ mode: string, whiteType: string, blackType: string, difficultyProfileId?: string }} params
   * @returns {Promise<Game>}
   */
  async create(params) {
    return Game.create({
      mode: params.mode,
      whiteType: params.whiteType,
      blackType: params.blackType,
      difficultyProfileId: params.difficultyProfileId ?? null,
      result: GameResult.IN_PROGRESS,
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<Game|null>}
   */
  async findById(id) {
    return Game.findByPk(id);
  }

  /**
   * @param {string} id
   * @param {string} result
   * @returns {Promise<void>}
   */
  async updateResult(id, result) {
    await Game.update(
      { result, endedAt: new Date() },
      { where: { id } },
    );
  }
}

module.exports = { GameRepository };
