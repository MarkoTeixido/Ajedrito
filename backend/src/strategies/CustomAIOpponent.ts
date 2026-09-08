import { OpponentStrategy } from './OpponentStrategy';

/**
 * Estrategia para el modo Jugador vs IA propia.
 * Stub — la implementación real con AIServiceAdapter va en la Iteración 4.
 */
export class CustomAIOpponent implements OpponentStrategy {
  async getNextMove(_fen: string): Promise<string> {
    // TODO (Iteración 4): delegar a AIServiceAdapter
    throw new Error('CustomAIOpponent no implementado todavía (Iteración 4).');
  }

  async dispose(): Promise<void> {
    // Sin recursos locales que liberar
  }
}
