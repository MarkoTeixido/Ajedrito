'use strict';

const { Router } = require('express');
const { Chess } = require('chess.js');
const { Game, GameResult } = require('../db/models/Game');
const { Move } = require('../db/models/Move');
const { MoveRepository } = require('../repositories/MoveRepository');
const { GameRepository } = require('../repositories/GameRepository');
const { AppError } = require('../middleware/errorHandler');

const router = Router({ mergeParams: true });
const moveRepo = new MoveRepository();
const gameRepo = new GameRepository();

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
      // El jugador que acaba de mover ganó (moveResult.color)
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

    res.json({
      move: savedMove,
      newFen: fenAfter,
      isGameOver,
      result,
      isCheck: chess.isCheck(),
      turn: chess.turn() === 'w' ? 'white' : 'black',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
