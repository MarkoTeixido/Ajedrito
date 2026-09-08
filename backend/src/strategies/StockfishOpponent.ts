import { OpponentStrategy } from './OpponentStrategy';

/**
 * Estrategia para el modo Jugador vs Stockfish.
 * Stub — la implementación real con StockfishAdapter va en la Iteración 3.
 */
export class StockfishOpponent implements OpponentStrategy {
  constructor(
    private readonly skillLevel: number,
    private readonly searchDepth: number,
    private readonly timeLimitMs: number,
  ) {}

  async getNextMove(_fen: string): Promise<string> {
    // TODO (Iteración 3): delegar a StockfishAdapter
    throw new Error('StockfishOpponent no implementado todavía (Iteración 3).');
  }

  async dispose(): Promise<void> {
    // TODO (Iteración 3): cerrar el proceso de Stockfish
  }
}
