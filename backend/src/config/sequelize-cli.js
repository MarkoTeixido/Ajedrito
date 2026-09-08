/**
 * Configuración de Sequelize CLI para leer DATABASE_URL desde .env
 * Este archivo es usado solo por el CLI (migraciones).
 * Usamos path explícito para que funcione sin importar el CWD desde el que
 * se invoque sequelize-cli.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
