'use strict';

const { Router } = require('express');
const { MoveService } = require('../services/MoveService');
const { AppError } = require('../middleware/errorHandler');

const router = Router({ mergeParams: true });
const moveService = new MoveService();

// ── POST /api/games/:id/moves ────────────────────────────────────────────────
// Procesa la jugada del jugador: valida, persiste y dispara el turno del oponente.
// CRÍTICO: la jugada se guarda en la DB en el momento en que ocurre, no al final.
// La respuesta HTTP se envía ANTES de que el oponente calcule su jugada.
// El oponente notifica su respuesta de forma asíncrona vía Socket.io.

router.post('/', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, promotion, timeSpentMs } = req.body;

    if (!from || !to) {
      return next(new AppError(400, 'Los campos "from" y "to" son obligatorios'));
    }

    const io = req.app.get('io');
    const result = await moveService.processPlayerMove(id, from, to, promotion, timeSpentMs, io);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

