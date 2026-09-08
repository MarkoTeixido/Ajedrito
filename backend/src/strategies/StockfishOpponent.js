'use strict';

const { OpponentStrategy } = require('./OpponentStrategy');

/**
 * Estrategia para el modo Jugador vs Stockfish.
 * Stub — la implementación real con StockfishAdapter va en la Iteración 3.
 */
class StockfishOpponent extends OpponentStrategy {
  /**
   * @param {number} skillLevel
   * @param {number} searchDepth
   * @param {number} timeLimitMs
   */
  constructor(skillLevel, searchDepth, timeLimitMs) {
    super();
    this.skillLevel = skillLevel;
    this.searchDepth = searchDepth;
    this.timeLimitMs = timeLimitMs;
  }

  async getNextMove(_fen) {
    // TODO (Iteración 3): delegar a StockfishAdapter
    throw new Error('StockfishOpponent no implementado todavía (Iteración 3).');
  }

  async dispose() {
    // TODO (Iteración 3): cerrar el proceso de Stockfish
  }
}

module.exports = { StockfishOpponent };
