import { Game, GameMode, GameResult, PlayerType } from '@/db/models/Game';

/**
 * Repository para la entidad Game.
 * Encapsula toda interacción de Sequelize con la tabla games.
 */
export class GameRepository {
  async create(params: {
    mode: GameMode;
    whiteType: PlayerType;
    blackType: PlayerType;
    difficultyProfileId?: string;
  }): Promise<Game> {
    return Game.create({
      mode: params.mode,
      whiteType: params.whiteType,
      blackType: params.blackType,
      difficultyProfileId: params.difficultyProfileId ?? null,
      result: GameResult.IN_PROGRESS,
    });
  }

  async findById(id: string): Promise<Game | null> {
    return Game.findByPk(id);
  }

  async updateResult(id: string, result: GameResult): Promise<void> {
    await Game.update(
      { result, endedAt: new Date() },
      { where: { id } },
    );
  }
}
