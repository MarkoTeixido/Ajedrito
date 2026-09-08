'use strict';

const { Router } = require('express');
const { sequelize } = require('../config/database');

const router = Router();

/**
 * GET /health
 * Verifica que el servidor y la conexión a la DB estén operativos.
 */
router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('[Health] DB no disponible:', err.message);
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
