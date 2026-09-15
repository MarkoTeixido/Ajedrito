'use strict';

const { Game, GameResult } = require('../db/models/Game');
const { INITIAL_FEN } = require('../constants/chess');

/**
 * Repository para la entidad Game.
 * Encapsula toda interacción de Sequelize con la tabla games.
 * Las rutas y servicios nunca acceden directamente al modelo — usan este repository.
 */
class GameRepository {
  /**
   * Crea una nueva partida con el resultado IN_PROGRESS y el FEN inicial.
   * @param {{ mode: string, whiteType: string, blackType: string, difficultyProfileId?: string, source?: string }} params
   * @returns {Promise<Game>}
   */
  async create(params) {
    return Game.create({
      mode:                params.mode,
      whiteType:           params.whiteType,
      blackType:           params.blackType,
      difficultyProfileId: params.difficultyProfileId ?? null,
      result:              GameResult.IN_PROGRESS,
      currentFen:          INITIAL_FEN,
      source:              params.source ?? 'USER',
    });
  }

  /**
   * Busca una partida por su identificador único.
   * @param {string} id
   * @returns {Promise<Game|null>}
   */
  async findById(id) {
    return Game.findByPk(id);
  }

  /**
   * Actualiza el FEN actual de la partida tras un movimiento.
   * @param {string} id
   * @param {string} fen
   * @returns {Promise<void>}
   */
  async updateCurrentFen(id, fen) {
    await Game.update({ currentFen: fen }, { where: { id } });
  }

  /**
   * Marca la partida como finalizada con el resultado dado y registra la fecha/hora.
   * @param {string} id
   * @param {string} result - Valor de GameResult.
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

