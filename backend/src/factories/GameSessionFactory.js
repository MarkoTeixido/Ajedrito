'use strict';

const { GameMode, PlayerType } = require('../db/models/Game');
const { DifficultyProfile } = require('../db/models/DifficultyProfile');
const { GameRepository } = require('../repositories/GameRepository');
const { MoveRepository } = require('../repositories/MoveRepository');
const { HumanOpponent } = require('../strategies/HumanOpponent');
const { StockfishOpponent } = require('../strategies/StockfishOpponent');
const { CustomAIOpponent } = require('../strategies/CustomAIOpponent');

/**
 * Factory que crea una GameSession completa según el modo de juego.
 * Centraliza la lógica de instanciación — el resto del código nunca
 * construye estrategias directamente.
 */
class GameSessionFactory {
  constructor() {
    this.gameRepo = new GameRepository();
    this.moveRepo = new MoveRepository();
  }

  /**
   * @param {{ mode: string, difficultyProfileId?: string }} params
   * @returns {Promise<{ gameId: string, mode: string, opponentStrategy: import('../strategies/OpponentStrategy').OpponentStrategy, gameRepo: GameRepository, moveRepo: MoveRepository }>}
   */
  async create({ mode, difficultyProfileId }) {
    let whiteType;
    let blackType;
    let opponentStrategy;

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
          throw new Error(`DifficultyProfile no encontrado: ${difficultyProfileId}`);
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
        throw new Error(`Modo de juego desconocido: ${mode}`);
    }

    const game = await this.gameRepo.create({ mode, whiteType, blackType, difficultyProfileId });

    return {
      gameId: game.id,
      mode,
      opponentStrategy,
      gameRepo: this.gameRepo,
      moveRepo: this.moveRepo,
    };
  }
}

module.exports = { GameSessionFactory };
