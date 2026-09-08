import { GameMode, PlayerType } from '@/db/models/Game';
import { GameRepository } from '@/repositories/GameRepository';
import { MoveRepository } from '@/repositories/MoveRepository';
import { OpponentStrategy } from '@/strategies/OpponentStrategy';
import { HumanOpponent } from '@/strategies/HumanOpponent';
import { StockfishOpponent } from '@/strategies/StockfishOpponent';
import { CustomAIOpponent } from '@/strategies/CustomAIOpponent';
import { DifficultyProfile } from '@/db/models/DifficultyProfile';

export interface GameSession {
  gameId: string;
  mode: GameMode;
  opponentStrategy: OpponentStrategy;
  gameRepo: GameRepository;
  moveRepo: MoveRepository;
}

/**
 * Factory que crea una GameSession completa según el modo de juego.
 * Centraliza la lógica de instanciación para que el resto del código
 * no necesite saber qué estrategia usar.
 */
export class GameSessionFactory {
  private readonly gameRepo = new GameRepository();
  private readonly moveRepo = new MoveRepository();

  async create(params: {
    mode: GameMode;
    difficultyProfileId?: string;
  }): Promise<GameSession> {
    const { mode, difficultyProfileId } = params;

    let whiteType: PlayerType;
    let blackType: PlayerType;
    let opponentStrategy: OpponentStrategy;

    switch (mode) {
      case GameMode.PVP:
        whiteType = PlayerType.HUMAN;
        blackType = PlayerType.HUMAN;
        opponentStrategy = new HumanOpponent();
        break;

      case GameMode.PV_STOCKFISH: {
        const profile = difficultyProfileId
          ? await DifficultyProfile.findByPk(difficultyProfileId)
          : null;

        if (!profile) {
          throw new Error(
            `DifficultyProfile no encontrado: ${difficultyProfileId}`,
          );
        }

        whiteType = PlayerType.HUMAN;
        blackType = PlayerType.STOCKFISH;
        opponentStrategy = new StockfishOpponent(
          profile.skillLevel,
          profile.searchDepth,
          profile.timeLimitMs,
        );
        break;
      }

      case GameMode.PV_AI:
        whiteType = PlayerType.HUMAN;
        blackType = PlayerType.AI;
        opponentStrategy = new CustomAIOpponent();
        break;

      default:
        // TypeScript exhaustiveness check
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _exhaustive: never = mode;
        throw new Error(`Modo de juego desconocido: ${mode as string}`);
    }

    const game = await this.gameRepo.create({
      mode,
      whiteType,
      blackType,
      difficultyProfileId,
    });

    return {
      gameId: game.id,
      mode,
      opponentStrategy,
      gameRepo: this.gameRepo,
      moveRepo: this.moveRepo,
    };
  }
}
