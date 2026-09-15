'use strict';

const { GameResult } = require('../db/models/Game');

/**
 * Evalúa el estado de la partida después de un movimiento y determina
 * si ha finalizado y cuál es el resultado.
 *
 * Responsabilidad única: encapsular toda la lógica de detección de
 * fin de partida para que no esté duplicada en múltiples handlers.
 */
class GameStateEvaluator {
  /**
   * Analiza el objeto Chess (chess.js) posterior a un movimiento y retorna
   * el resultado de la partida y si ésta ha finalizado.
   *
   * @param {import('chess.js').Chess} chess  - Instancia de chess.js con el movimiento ya aplicado.
   * @param {import('chess.js').Move}  moveResult - Objeto de movimiento retornado por chess.move().
   * @returns {{ result: string, isGameOver: boolean }}
   */
  static evaluate(chess, moveResult) {
    if (chess.isCheckmate()) {
      // El jugador que acaba de mover ('w' o 'b') es quien gana.
      const result = moveResult.color === 'w'
        ? GameResult.WHITE_WINS
        : GameResult.BLACK_WINS;
      return { result, isGameOver: true };
    }

    const isDraw =
      chess.isStalemate() ||
      chess.isInsufficientMaterial() ||
      chess.isThreefoldRepetition() ||
      chess.isDraw();

    if (isDraw) {
      return { result: GameResult.DRAW, isGameOver: true };
    }

    return { result: GameResult.IN_PROGRESS, isGameOver: false };
  }
}

module.exports = { GameStateEvaluator };
