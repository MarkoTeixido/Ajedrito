import { Move, PieceColor } from '@/db/models/Move';

/**
 * Repository para la entidad Move.
 * Persiste cada jugada individualmente — nunca al final de la partida.
 */
export class MoveRepository {
  async create(params: {
    gameId: string;
    moveNumber: number;
    color: PieceColor;
    san: string;
    fenBefore: string;
    fenAfter: string;
    timeSpentMs: number;
    evalScore?: number;
  }): Promise<Move> {
    return Move.create({
      gameId: params.gameId,
      moveNumber: params.moveNumber,
      color: params.color,
      san: params.san,
      fenBefore: params.fenBefore,
      fenAfter: params.fenAfter,
      timeSpentMs: params.timeSpentMs,
      evalScore: params.evalScore ?? null,
    });
  }

  async findByGameId(gameId: string): Promise<Move[]> {
    return Move.findAll({
      where: { gameId },
      order: [['moveNumber', 'ASC']],
    });
  }
}
