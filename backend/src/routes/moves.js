'use strict';

const { Router } = require('express');
const { Chess } = require('chess.js');
const { Game, GameResult, GameMode } = require('../db/models/Game');
const { Move } = require('../db/models/Move');
const { DifficultyProfile } = require('../db/models/DifficultyProfile');
const { MoveRepository } = require('../repositories/MoveRepository');
const { GameRepository } = require('../repositories/GameRepository');
const { StockfishOpponent } = require('../strategies/StockfishOpponent');
const { AppError } = require('../middleware/errorHandler');

const router = Router({ mergeParams: true });
const moveRepo = new MoveRepository();
const gameRepo = new GameRepository();

/**
 * Procesa la jugada del motor Stockfish de forma asíncrona y emite el resultado por Socket.io.
 * Persiste la jugada de inmediato en la base de datos según los requerimientos de GEMINI.md.
 * @param {string} gameId
 * @param {string} fenAfter
 * @param {string|null} difficultyProfileId
 * @param {import('socket.io').Server|null} io
 */
async function handleStockfishTurn(gameId, fenAfter, difficultyProfileId, io) {
  try {
    const profile = difficultyProfileId
      ? await DifficultyProfile.findByPk(difficultyProfileId)
      : null;

    const skillLevel = profile ? profile.skillLevel : 5;
    const searchDepth = profile ? profile.searchDepth : 5;
    const timeLimitMs = profile ? profile.timeLimitMs : 500;

    const opponent = new StockfishOpponent(skillLevel, searchDepth, timeLimitMs);
    const startMs = Date.now();
    const opponentMove = await opponent.getNextMove(fenAfter);
    const timeSpentMs = Date.now() - startMs;

    const chess = new Chess(fenAfter);
    let moveResult;
    try {
      moveResult = chess.move({
        from: opponentMove.from,
        to: opponentMove.to,
        promotion: opponentMove.promotion || 'q',
      });
    } catch (moveErr) {
      console.error('[Stockfish] Error aplicando jugada:', moveErr);
      return;
    }

    if (!moveResult) {
      console.error('[Stockfish] Movimiento ilegal devuelto por el motor:', opponentMove);
      return;
    }

    const moveCount = await Move.count({ where: { gameId } });
    const fenFinal = chess.fen();
    const moveColor = moveResult.color === 'w' ? 'white' : 'black';

    // Persistir jugada de Stockfish inmediatamente en DB
    const savedMove = await moveRepo.create({
      gameId,
      moveNumber: moveCount + 1,
      color: moveColor,
      san: moveResult.san,
      fenBefore: fenAfter,
      fenAfter: fenFinal,
      timeSpentMs,
    });

    await Game.update({ currentFen: fenFinal }, { where: { id: gameId } });

    // Detectar fin de partida tras la jugada de Stockfish
    let result = GameResult.IN_PROGRESS;
    let isGameOver = false;

    if (chess.isCheckmate()) {
      result = moveResult.color === 'w' ? GameResult.WHITE_WINS : GameResult.BLACK_WINS;
      isGameOver = true;
    } else if (
      chess.isStalemate() ||
      chess.isInsufficientMaterial() ||
      chess.isThreefoldRepetition() ||
      chess.isDraw()
    ) {
      result = GameResult.DRAW;
      isGameOver = true;
    }

    if (isGameOver) {
      await gameRepo.updateResult(gameId, result);
    }

    if (io) {
      io.to(gameId).emit('opponent-move', {
        move: savedMove,
        newFen: fenFinal,
        isGameOver,
        result,
        isCheck: chess.isCheck(),
        turn: chess.turn() === 'w' ? 'white' : 'black',
      });
    }
  } catch (err) {
    console.error('[Stockfish] Error procesando jugada de Stockfish:', err);
    if (io) {
      io.to(gameId).emit('opponent-error', {
        message: 'Ocurrió un error al procesar la jugada del motor.',
      });
    }
  }
}

// ── POST /api/games/:id/moves ────────────────────────────────────────────────
// Procesa una jugada: valida con chess.js, persiste en DB y detecta fin de partida.
// CRÍTICO: la jugada se guarda en la DB en el momento en que ocurre, no al final.

router.post('/', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, promotion } = req.body;

    // Validar campos obligatorios
    if (!from || !to) {
      return next(new AppError(400, 'Los campos "from" y "to" son obligatorios'));
    }

    // Cargar la partida
    const game = await Game.findByPk(id);
    if (!game) return next(new AppError(404, 'Partida no encontrada'));

    if (game.result !== GameResult.IN_PROGRESS) {
      return next(new AppError(400, 'La partida ya terminó'));
    }

    // Validar la jugada contra la posición actual con chess.js
    const chess = new Chess(game.currentFen);
    let moveResult;
    try {
      moveResult = chess.move({ from, to, promotion: promotion || 'q' });
    } catch {
      return next(new AppError(400, `Jugada ilegal: ${from}-${to}`));
    }

    if (!moveResult) {
      return next(new AppError(400, `Jugada ilegal: ${from}-${to}`));
    }

    const fenBefore = game.currentFen;
    const fenAfter = chess.fen();
    const moveColor = moveResult.color === 'w' ? 'white' : 'black';

    // Contar jugadas anteriores para asignar el número de movimiento correcto
    const moveCount = await Move.count({ where: { gameId: id } });

    // ── GUARDAR LA JUGADA INMEDIATAMENTE ────────────────────────────────────
    // Requisito explícito: persistir cada jugada en el momento en que ocurre.
    const savedMove = await moveRepo.create({
      gameId: id,
      moveNumber: moveCount + 1,
      color: moveColor,
      san: moveResult.san,
      fenBefore,
      fenAfter,
      timeSpentMs: req.body.timeSpentMs ?? 0,
    });

    // Actualizar el FEN actual de la partida
    await Game.update({ currentFen: fenAfter }, { where: { id } });

    // ── Detectar fin de partida ──────────────────────────────────────────────
    let result = GameResult.IN_PROGRESS;
    let isGameOver = false;

    if (chess.isCheckmate()) {
      result = moveResult.color === 'w' ? GameResult.WHITE_WINS : GameResult.BLACK_WINS;
      isGameOver = true;
    } else if (
      chess.isStalemate() ||
      chess.isInsufficientMaterial() ||
      chess.isThreefoldRepetition() ||
      chess.isDraw()
    ) {
      result = GameResult.DRAW;
      isGameOver = true;
    }

    if (isGameOver) {
      await gameRepo.updateResult(id, result);
    }

    // Respuesta HTTP inmediata para el jugador
    res.json({
      move: savedMove,
      newFen: fenAfter,
      isGameOver,
      result,
      isCheck: chess.isCheck(),
      turn: chess.turn() === 'w' ? 'white' : 'black',
    });

    // Si la partida no terminó y el rival es Stockfish, calcular jugada asíncrona
    if (!isGameOver && game.mode === GameMode.PV_STOCKFISH) {
      const io = req.app.get('io');
      handleStockfishTurn(id, fenAfter, game.difficultyProfileId, io);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
