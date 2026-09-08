/**
 * Interfaz Strategy para los oponentes.
 * GameSession interactúa únicamente con esta interfaz —
 * no sabe si juega contra un humano, Stockfish o la IA propia.
 */
export interface OpponentStrategy {
  /**
   * Retorna la jugada en SAN que el oponente quiere realizar
   * dado el FEN de la posición actual.
   * Throws si no puede generar una jugada válida.
   */
  getNextMove(fen: string): Promise<string>;

  /** Libera recursos del oponente (cierra procesos, conexiones, etc.) */
  dispose(): Promise<void>;
}
