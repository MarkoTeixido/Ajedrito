/**
 * Constantes de dominio de ajedrez compartidas en el frontend de Ajedrito.
 */

/** FEN de la posición inicial estándar del ajedrez (FIDE) */
export const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Etiquetas legibles para los estados de finalización de partida */
export const RESULT_LABELS: Record<string, string> = {
  WHITE_WINS: '¡Ganan las Blancas!',
  BLACK_WINS: '¡Ganan las Negras!',
  DRAW: '¡Tablas!',
  IN_PROGRESS: 'Partida en curso',
};

/** Estilos institucionales para react-chessboard */
export const BOARD_THEME = {
  darkSquareColor: '#879D8B',
  lightSquareColor: '#DFE6DF',
  borderRadius: '12px',
} as const;
