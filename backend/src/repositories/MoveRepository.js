'use strict';

const { Move } = require('../db/models/Move');

/**
 * Repository para la entidad Move.
 * Persiste cada jugada individualmente — nunca al final de la partida.
 */
class MoveRepository {
  /**
   * @param {{ gameId: string, moveNumber: number, color: string, san: string, fenBefore: string, fenAfter: string, timeSpentMs: number, evalScore?: number }} params
   * @returns {Promise<Move>}
   */
  async create(params) {
    return Move.create({
      gameId: params.gameId,
      moveNumber: params.moveNumber,
      color: params.color,
      san: params.san,
      fenBefore: params.fenBefore,
      fenAfter: params.fenAfter,
      timeSpentMs: params.timeSpentMs,
      evalScore: params.evalScore ?? null,
    });
  }

  /**
   * @param {string} gameId
   * @returns {Promise<Move[]>}
   */
  async findByGameId(gameId) {
    return Move.findAll({
      where: { gameId },
      order: [['moveNumber', 'ASC']],
    });
  }
}

module.exports = { MoveRepository };
