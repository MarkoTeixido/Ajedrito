/**
 * Configuración de Sequelize CLI para leer DATABASE_URL desde .env
 * Este archivo es solo para el CLI (migraciones) — el código TypeScript
 * usa src/config/database.ts directamente.
 */
require('dotenv').config();

/** @type {import('sequelize').Options} */
const baseOptions = {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // necesario para Supabase
    },
  },
  logging: false,
};

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    ...baseOptions,
  },
  test: {
    url: process.env.DATABASE_URL,
    ...baseOptions,
  },
  production: {
    url: process.env.DATABASE_URL,
    ...baseOptions,
  },
};
