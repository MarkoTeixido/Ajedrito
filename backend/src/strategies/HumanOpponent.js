'use strict';

const { OpponentStrategy } = require('./OpponentStrategy');

/**
 * Estrategia para el modo Jugador vs Jugador (hotseat).
 * No genera jugadas — el movimiento lo provee el frontend directamente.
 */
class HumanOpponent extends OpponentStrategy {
  async getNextMove(_fen) {
    throw new Error(
      'HumanOpponent no genera jugadas automáticas. ' +
      'En modo PVP, el movimiento proviene del frontend.',
    );
  }
}

module.exports = { HumanOpponent };
