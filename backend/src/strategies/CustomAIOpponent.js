'use strict';

const { OpponentStrategy } = require('./OpponentStrategy');

/**
 * Estrategia para el modo Jugador vs IA propia.
 * Stub — la implementación real con AIServiceAdapter va en la Iteración 4.
 */
class CustomAIOpponent extends OpponentStrategy {
  async getNextMove(_fen) {
    // TODO (Iteración 4): delegar a AIServiceAdapter
    throw new Error('CustomAIOpponent no implementado todavía (Iteración 4).');
  }
}

module.exports = { CustomAIOpponent };
