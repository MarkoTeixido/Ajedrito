import { OpponentStrategy } from './OpponentStrategy';

/**
 * Estrategia para el modo Jugador vs Jugador (hotseat).
 * No genera jugadas — el movimiento lo provee el frontend directamente.
 * getNextMove() no debería llamarse en este modo; si se llama, lanza error.
 */
export class HumanOpponent implements OpponentStrategy {
  async getNextMove(_fen: string): Promise<string> {
    throw new Error(
      'HumanOpponent no genera jugadas automáticas. ' +
      'En modo PVP, el movimiento proviene del frontend.',
    );
  }

  async dispose(): Promise<void> {
    // Sin recursos que liberar
  }
}
