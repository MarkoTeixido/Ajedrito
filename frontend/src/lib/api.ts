/**
 * Cliente HTTP para el backend de Ajedrito.
 * Centraliza todas las llamadas a la API para evitar URLs hardcodeadas.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type GameMode = 'PVP' | 'PV_STOCKFISH' | 'PV_AI';

export interface CreateGameResponse {
  gameId: string;
  mode: GameMode;
  fen: string;
}

export interface GameStateResponse {
  game: {
    id: string;
    mode: GameMode;
    result: string;
    currentFen: string;
    startedAt: string;
  };
  moves: MoveRecord[];
}

export interface MoveRecord {
  id: string;
  moveNumber: number;
  color: 'white' | 'black';
  san: string;
  fenBefore: string;
  fenAfter: string;
  timeSpentMs: number;
  createdAt: string;
}

export interface MakeMoveResponse {
  move: MoveRecord;
  newFen: string;
  isGameOver: boolean;
  result: string;
  isCheck: boolean;
  turn: 'white' | 'black';
}

// ── Funciones ─────────────────────────────────────────────────────────────────

/**
 * Crea una nueva partida en el backend.
 */
export async function createGame(
  mode: GameMode,
  difficultyProfileId?: string,
): Promise<CreateGameResponse> {
  const res = await fetch(`${BACKEND_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, difficultyProfileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error ?? 'Error al crear la partida');
  }

  return res.json();
}

/**
 * Obtiene el estado actual de una partida (FEN + historial de jugadas).
 */
export async function getGame(gameId: string): Promise<GameStateResponse> {
  const res = await fetch(`${BACKEND_URL}/api/games/${gameId}`);

  if (!res.ok) {
    throw new Error('Partida no encontrada');
  }

  return res.json();
}

/**
 * Realiza una jugada en la partida especificada.
 * El backend valida la jugada con chess.js y la persiste en la DB inmediatamente.
 */
export async function makeMove(
  gameId: string,
  from: string,
  to: string,
  promotion = 'q',
  timeSpentMs = 0,
): Promise<MakeMoveResponse> {
  const res = await fetch(`${BACKEND_URL}/api/games/${gameId}/moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, promotion, timeSpentMs }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error ?? 'Error al realizar la jugada');
  }

  return res.json();
}
