'use strict';

const { Chess } = require('chess.js');
const { Game, GameMode } = require('../db/models/Game');
const { Move } = require('../db/models/Move');
const { DifficultyProfile } = require('../db/models/DifficultyProfile');
const { GameRepository } = require('../repositories/GameRepository');
const { MoveRepository } = require('../repositories/MoveRepository');
const { StockfishOpponent } = require('../strategies/StockfishOpponent');
const { CustomAIOpponent } = require('../strategies/CustomAIOpponent');
const { GameStateEvaluator } = require('./GameStateEvaluator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Servicio central para el procesamiento de movimientos de ajedrez.
 *
 * Encapsula toda la lógica de negocio relacionada con:
 *   - Validación y persistencia de la jugada del jugador.
 *   - Detección del fin de partida.
 *   - Cálculo y emisión asíncrona de la respuesta del oponente (Stockfish / IA).
 *
 * Las rutas (HTTP handlers) solo validan la entrada y delegan aquí.
 * Esto evita la duplicación de lógica y mantiene los routers limpios.
 */
class MoveService {
  /**
   * @param {GameRepository}  [gameRepo]
   * @param {MoveRepository}  [moveRepo]
   */
  constructor(gameRepo, moveRepo) {
    this.gameRepo = gameRepo || new GameRepository();
    this.moveRepo = moveRepo || new MoveRepository();
  }

  // ── Jugada del jugador ──────────────────────────────────────────────────────

  /**
   * Procesa la jugada del jugador humano:
   *   1. Valida que la partida exista y esté en curso.
   *   2. Valida la jugada con chess.js.
   *   3. Persiste la jugada en la base de datos.
   *   4. Actualiza el FEN actual en la partida.
   *   5. Detecta fin de partida.
   *   6. Dispara el turno del oponente de forma asíncrona (no bloquea la respuesta HTTP).
   *
   * @param {string}                    gameId
   * @param {string}                    from           - Casilla origen (p. ej. 'e2').
   * @param {string}                    to             - Casilla destino (p. ej. 'e4').
   * @param {string|undefined}          promotion      - Pieza de promoción ('q', 'r', 'b', 'n').
   * @param {number}                    timeSpentMs    - Tiempo empleado por el jugador en ms.
   * @param {import('socket.io').Server|null} io       - Instancia de Socket.io para notificaciones.
   * @returns {Promise<{move: object, newFen: string, isGameOver: boolean, result: string, isCheck: boolean, turn: string}>}
   * @throws {AppError} 404 si la partida no existe, 400 si ya terminó o el movimiento es ilegal.
   */
  async processPlayerMove(gameId, from, to, promotion, timeSpentMs, io) {
    const game = await this.gameRepo.findById(gameId);
    if (!game) throw new AppError(404, 'Partida no encontrada');

    if (game.result !== 'IN_PROGRESS') {
      throw new AppError(400, 'La partida ya terminó');
    }

    // Validar la jugada contra la posición actual con chess.js
    const chess = new Chess(game.currentFen);
    let moveResult;
    try {
      moveResult = chess.move({ from, to, promotion: promotion || 'q' });
    } catch {
      throw new AppError(400, `Jugada ilegal: ${from}-${to}`);
    }
    if (!moveResult) throw new AppError(400, `Jugada ilegal: ${from}-${to}`);

    const fenBefore = game.currentFen;
    const fenAfter  = chess.fen();
    const moveColor = moveResult.color === 'w' ? 'white' : 'black';

    // Contar movimientos anteriores para el número de movimiento correcto
    const moveCount = await Move.count({ where: { gameId } });

    // Persistir jugada inmediatamente (requisito explícito del sistema)
    const savedMove = await this.moveRepo.create({
      gameId,
      moveNumber: moveCount + 1,
      color:      moveColor,
      san:        moveResult.san,
      fenBefore,
      fenAfter,
      timeSpentMs: timeSpentMs ?? 0,
    });

    // Actualizar FEN actual de la partida
    await this.gameRepo.updateCurrentFen(gameId, fenAfter);

    // Detectar fin de partida
    const { result, isGameOver } = GameStateEvaluator.evaluate(chess, moveResult);
    if (isGameOver) {
      await this.gameRepo.updateResult(gameId, result);
    }

    const response = {
      move:       savedMove,
      newFen:     fenAfter,
      isGameOver,
      result,
      isCheck:    chess.isCheck(),
      turn:       chess.turn() === 'w' ? 'white' : 'black',
    };

    // Lanzar el turno del oponente de forma asíncrona SIN bloquear la respuesta HTTP
    if (!isGameOver) {
      this._scheduleOpponentTurn(game, fenAfter, io);
    }

    return response;
  }

  // ── Turno del oponente ──────────────────────────────────────────────────────

  /**
   * Despacha el turno del oponente según el modo de la partida.
   * Se llama de forma asíncrona (fire-and-forget) para no bloquear la respuesta HTTP.
   *
   * @param {object}                         game    - Modelo Sequelize de la partida.
   * @param {string}                         fenAfter - FEN resultante de la jugada del jugador.
   * @param {import('socket.io').Server|null} io
   */
  _scheduleOpponentTurn(game, fenAfter, io) {
    if (game.mode === GameMode.PV_STOCKFISH) {
      this._handleStockfishTurn(game.id, fenAfter, game.difficultyProfileId, io);
    } else if (game.mode === GameMode.PV_AI) {
      this._handleCustomAITurn(game.id, fenAfter, io);
    }
    // En modo PVP no hay oponente automático — el siguiente humano moverá
  }

  /**
   * Calcula y persiste la jugada de Stockfish, luego notifica al cliente via Socket.io.
   *
   * @param {string}                         gameId
   * @param {string}                         fenAfter
   * @param {string|null}                    difficultyProfileId
   * @param {import('socket.io').Server|null} io
   */
  async _handleStockfishTurn(gameId, fenAfter, difficultyProfileId, io) {
    try {
      const profile = difficultyProfileId
        ? await DifficultyProfile.findByPk(difficultyProfileId)
        : null;

      // Valores de fallback si no hay perfil (situación defensiva)
      const skillLevel  = profile?.skillLevel  ?? 5;
      const searchDepth = profile?.searchDepth ?? 5;
      const timeLimitMs = profile?.timeLimitMs ?? 500;

      const opponent  = new StockfishOpponent(skillLevel, searchDepth, timeLimitMs);
      const startMs   = Date.now();
      const opponentMove = await opponent.getNextMove(fenAfter);
      const timeSpentMs  = Date.now() - startMs;

      await this._applyAndPersistOpponentMove(gameId, fenAfter, opponentMove, timeSpentMs, io, {});
    } catch (err) {
      console.error('[MoveService/Stockfish] Error procesando jugada del motor:', err);
      this._emitOpponentError(io, gameId, 'Ocurrió un error al procesar la jugada del motor.');
    }
  }

  /**
   * Obtiene y persiste la jugada de la IA propia, luego notifica al cliente via Socket.io.
   *
   * @param {string}                         gameId
   * @param {string}                         fenAfter
   * @param {import('socket.io').Server|null} io
   */
  async _handleCustomAITurn(gameId, fenAfter, io) {
    try {
      const opponent = new CustomAIOpponent();
      const startMs  = Date.now();
      const opponentMove = await opponent.getNextMove(fenAfter, gameId);
      const timeSpentMs  = Date.now() - startMs;

      // El campo 'aiMethod' se emite al cliente para depuración/estadísticas
      const extra = { aiMethod: opponentMove.method };
      await this._applyAndPersistOpponentMove(gameId, fenAfter, opponentMove, timeSpentMs, io, extra);
    } catch (err) {
      console.error('[MoveService/AI] Error procesando jugada de la IA propia:', err);
      this._emitOpponentError(io, gameId, 'Ocurrió un error al comunicarse con el servicio de IA propia.');
    }
  }

  // ── Helpers internos ────────────────────────────────────────────────────────

  /**
   * Aplica la jugada del oponente al tablero, la persiste y emite el evento Socket.io.
   * Usado tanto por el turno de Stockfish como por el de la IA propia.
   *
   * @param {string}                          gameId
   * @param {string}                          fenBefore     - FEN antes de la jugada del oponente.
   * @param {{ from: string, to: string, promotion?: string }} opponentMove
   * @param {number}                          timeSpentMs
   * @param {import('socket.io').Server|null} io
   * @param {object}                          extraPayload  - Datos adicionales para el evento Socket.io.
   */
  async _applyAndPersistOpponentMove(gameId, fenBefore, opponentMove, timeSpentMs, io, extraPayload) {
    const chess = new Chess(fenBefore);
    let moveResult;
    try {
      moveResult = chess.move({
        from:      opponentMove.from,
        to:        opponentMove.to,
        promotion: opponentMove.promotion || 'q',
      });
    } catch (moveErr) {
      console.error('[MoveService] Error aplicando jugada del oponente:', moveErr);
      return;
    }

    if (!moveResult) {
      console.error('[MoveService] Movimiento ilegal devuelto por el oponente:', opponentMove);
      return;
    }

    const fenAfter  = chess.fen();
    const moveColor = moveResult.color === 'w' ? 'white' : 'black';
    const moveCount = await Move.count({ where: { gameId } });

    const savedMove = await this.moveRepo.create({
      gameId,
      moveNumber: moveCount + 1,
      color:      moveColor,
      san:        moveResult.san,
      fenBefore,
      fenAfter,
      timeSpentMs,
    });

    await this.gameRepo.updateCurrentFen(gameId, fenAfter);

    const { result, isGameOver } = GameStateEvaluator.evaluate(chess, moveResult);
    if (isGameOver) {
      await this.gameRepo.updateResult(gameId, result);
    }

    if (io) {
      io.to(gameId).emit('opponent-move', {
        move: savedMove,
        newFen: fenAfter,
        isGameOver,
        result,
        isCheck: chess.isCheck(),
        turn:    chess.turn() === 'w' ? 'white' : 'black',
        ...extraPayload,
      });
    }
  }

  /**
   * Emite el evento de error del oponente al cliente.
   *
   * @param {import('socket.io').Server|null} io
   * @param {string} gameId
   * @param {string} message
   */
  _emitOpponentError(io, gameId, message) {
    if (io) {
      io.to(gameId).emit('opponent-error', { message });
    }
  }
}

module.exports = { MoveService };
