'use strict';

/**
 * Configuracion de Jest para el backend de Ajedrito.
 * - testEnvironment: node (no browser APIs needed).
 * - coverage: recopilado solo de los modulos relevantes para evitar ruido.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/scripts/**',
    '!src/db/migrations/**',
  ],
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
};
