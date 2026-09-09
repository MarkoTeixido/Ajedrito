'use strict';

const { OpponentStrategy } = require('./OpponentStrategy');
const { StockfishAdapter } = require('../adapters/StockfishAdapter');

/**
 * Estrategia para el modo Jugador vs Stockfish.
 * Delegada al StockfishAdapter que maneja el subproceso UCI.
 */
class StockfishOpponent extends OpponentStrategy {
  /**
   * @param {number} skillLevel
   * @param {number} searchDepth
   * @param {number} timeLimitMs
   * @param {StockfishAdapter} [adapter]
   */
  constructor(skillLevel, searchDepth, timeLimitMs, adapter) {
    super();
    this.skillLevel = skillLevel;
    this.searchDepth = searchDepth;
    this.timeLimitMs = timeLimitMs;
    this.adapter = adapter || new StockfishAdapter();
  }

  /**
   * Calcula la siguiente jugada para la posición FEN dada.
   * @param {string} fen
   * @returns {Promise<{ from: string, to: string, promotion?: string, raw: string }>}
   */
  async getNextMove(fen) {
    return this.adapter.getBestMove(fen, {
      skillLevel: this.skillLevel,
      searchDepth: this.searchDepth,
      timeLimitMs: this.timeLimitMs,
    });
  }

  async dispose() {
    // El adaptador maneja el ciclo de vida del subproceso por cálculo
  }
}

module.exports = { StockfishOpponent };
