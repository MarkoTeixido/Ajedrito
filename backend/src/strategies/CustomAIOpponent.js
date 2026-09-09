'use strict';

const { OpponentStrategy } = require('./OpponentStrategy');
const { AIServiceAdapter } = require('../adapters/AIServiceAdapter');

/**
 * Estrategia para el modo Jugador vs IA propia.
 * Delegada al AIServiceAdapter que realiza llamadas HTTP al servicio Python FastAPI.
 */
class CustomAIOpponent extends OpponentStrategy {
  /**
   * @param {AIServiceAdapter} [adapter]
   */
  constructor(adapter) {
    super();
    this.adapter = adapter || new AIServiceAdapter();
  }

  /**
   * Obtiene la próxima jugada de la IA propia para la posición FEN dada.
   * @param {string} fen
   * @param {string} [gameId]
   * @returns {Promise<{ from: string, to: string, promotion?: string, san: string, confidence: number }>}
   */
  async getNextMove(fen, gameId) {
    return this.adapter.predictMove(fen, gameId);
  }

  async dispose() {
    // No requiere limpieza de procesos persistentes (conexión stateless HTTP)
  }
}

module.exports = { CustomAIOpponent };
