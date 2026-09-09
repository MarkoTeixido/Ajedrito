'use strict';

const { Router } = require('express');
const { DifficultyProfile } = require('../db/models/DifficultyProfile');

const router = Router();

// ── GET /api/difficulty-profiles ─────────────────────────────────────────────
// Retorna los perfiles de dificultad preconfigurados en la base de datos.

router.get('/', async (req, res, next) => {
  try {
    const { engine } = req.query;
    const where = {};
    if (engine) {
      where.engineType = engine.toUpperCase();
    }

    const profiles = await DifficultyProfile.findAll({
      where,
      order: [['skillLevel', 'ASC']],
    });

    res.json({ profiles });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
