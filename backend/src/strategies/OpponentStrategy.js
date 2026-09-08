'use strict';

/**
 * Clase base para la interfaz Strategy de oponentes.
 * GameSession solo habla con esta interfaz, sin saber
 * si el rival es humano, Stockfish o la IA propia.
 * @abstract
 */
class OpponentStrategy {
  /**
   * Retorna la jugada en SAN que el oponente quiere realizar.
   * @param {string} _fen - FEN de la posición actual
   * @returns {Promise<string>} jugada en SAN
   */
  async getNextMove(_fen) {
    throw new Error('getNextMove() debe ser implementado por la subclase.');
  }

  /**
   * Libera recursos del oponente (procesos, conexiones, etc.)
   * @returns {Promise<void>}
   */
  async dispose() {
    // Por defecto, sin recursos que liberar
  }
}

module.exports = { OpponentStrategy };
