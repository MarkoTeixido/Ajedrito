'use strict';

const { Router } = require('express');
const { Chess } = require('chess.js');
const { Game, GameMode, PlayerType } = require('../db/models/Game');
const { DifficultyProfile } = require('../db/models/DifficultyProfile');
const { Move } = require('../db/models/Move');
const { GameSessionFactory } = require('../factories/GameSessionFactory');
const { GameRepository } = require('../repositories/GameRepository');
const { MoveRepository } = require('../repositories/MoveRepository');
const { AppError } = require('../middleware/errorHandler');
const { INITIAL_FEN } = require('../constants/chess');

const router = Router();
const factory   = new GameSessionFactory();
const gameRepo  = new GameRepository();
const moveRepo  = new MoveRepository();

// ── POST /api/games ──────────────────────────────────────────────────────────
// Crea una nueva partida y devuelve el gameId + FEN inicial.
// Si la máquina juega con blancas, realiza el primer movimiento de forma
// síncrona para que el cliente reciba el FEN actualizado de inmediato.

router.post('/', async (req, res, next) => {
  try {
    const { mode, difficultyProfileId, playerColor = 'white' } = req.body;

    // Validar modo de juego
    if (!mode || !Object.values(GameMode).includes(mode)) {
      return next(
        new AppError(
          400,
          `Modo inválido: "${mode}". Valores válidos: ${Object.values(GameMode).join(', ')}`,
        ),
      );
    }

    // Para el modo contra Stockfish, difficultyProfileId es obligatorio
    if (mode === GameMode.PV_STOCKFISH && !difficultyProfileId) {
      return next(
        new AppError(400, `Se requiere difficultyProfileId para el modo ${mode}`),
      );
    }

    const session = await factory.create({ mode, difficultyProfileId, playerColor });
    let currentFen = INITIAL_FEN;

    // Si la máquina juega con blancas (el usuario eligió negras), mueve primero.
    // Se hace de forma síncrona para que el cliente reciba el FEN actualizado en la misma respuesta.
    if (session.whiteType !== PlayerType.HUMAN) {
      try {
        const startMs   = Date.now();
        const firstMove = await session.opponentStrategy.getNextMove(currentFen, session.gameId);
        const timeSpentMs = Date.now() - startMs;

        const chess      = new Chess(currentFen);
        const moveResult = chess.move({
          from:      firstMove.from,
          to:        firstMove.to,
          promotion: firstMove.promotion || 'q',
        });

        if (moveResult) {
          const fenAfter = chess.fen();

          await moveRepo.create({
            gameId:    session.gameId,
            moveNumber: 1,
            color:     'white',
            san:       moveResult.san,
            fenBefore: currentFen,
            fenAfter,
            timeSpentMs,
          });

          await gameRepo.updateCurrentFen(session.gameId, fenAfter);
          currentFen = fenAfter;
        }
      } catch (firstMoveErr) {
        // Error no fatal: la partida se crea igualmente desde la posición inicial.
        // El cliente puede solicitar el turno de la IA cuando esté listo.
        console.error('[Games] Error en la primera jugada de la máquina:', firstMoveErr);
      }
    }

    // Liberar recursos de la estrategia (proceso, conexión, etc.)
    await session.opponentStrategy.dispose();

    res.status(201).json({
      gameId:    session.gameId,
      mode,
      playerColor,
      whiteType: session.whiteType,
      blackType: session.blackType,
      fen:       currentFen,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/games/:id ───────────────────────────────────────────────────────
// Retorna el estado actual de la partida, incluyendo el FEN y el historial de jugadas.

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id, {
      include: [{ model: DifficultyProfile, as: 'difficultyProfile' }],
    });
    if (!game) return next(new AppError(404, 'Partida no encontrada'));

    // Cargar historial de jugadas ordenado por número de movimiento
    const moves = await Move.findAll({
      where: { gameId: id },
      order: [['moveNumber', 'ASC']],
    });

    res.json({ game, moves });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


