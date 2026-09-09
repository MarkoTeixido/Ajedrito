'use strict';

const { Router } = require('express');
const { GameMode } = require('../db/models/Game');
const { Game, Move, DifficultyProfile } = require('../db/models/index');
const { GameSessionFactory } = require('../factories/GameSessionFactory');
const { AppError } = require('../middleware/errorHandler');

const router = Router();
const factory = new GameSessionFactory();

// ── POST /api/games ──────────────────────────────────────────────────────────
// Crea una nueva partida y devuelve el gameId + FEN inicial.

router.post('/', async (req, res, next) => {
  try {
    const { mode, difficultyProfileId } = req.body;

    // Validar modo
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

    const session = await factory.create({ mode, difficultyProfileId });

    // Liberar la estrategia (para PVP no hace nada; para futuros modos se manejará diferente)
    await session.opponentStrategy.dispose();

    res.status(201).json({
      gameId: session.gameId,
      mode,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/games/:id ───────────────────────────────────────────────────────
// Retorna el estado actual de la partida, incluyendo el FEN y las jugadas.

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id, {
      include: [{ model: DifficultyProfile, as: 'difficultyProfile' }],
    });
    if (!game) return next(new AppError(404, 'Partida no encontrada'));

    // Cargar historial de jugadas para mostrar en el frontend
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
