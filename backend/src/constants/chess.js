'use strict';

/**
 * Constantes de dominio del juego de ajedrez compartidas en todo el backend.
 *
 * Centralizar aquí evita strings mágicos dispersos y garantiza consistencia
 * ante futuros cambios (p. ej. variantes de ajedrez con posición inicial diferente).
 */

/** FEN de la posición inicial estándar del ajedrez (FIDE). */
const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

module.exports = { INITIAL_FEN };
