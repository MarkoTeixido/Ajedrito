'use strict';

require('dotenv').config();

/**
 * Carga y valida las variables de entorno críticas.
 * El proceso falla inmediatamente si falta alguna variable obligatoria.
 * @param {string} name
 * @returns {string}
 */
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variable de entorno requerida faltante: ${name}`);
    process.exit(1);
  }
  return value;
}

const env = Object.freeze({
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
});

module.exports = { env };
