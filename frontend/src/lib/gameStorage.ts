/**
 * Gestor de persistencia local para reanudar partidas en Ajedrito.
 * Almacena los IDs de las partidas iniciadas en el navegador en localStorage
 * permitiendo retomar partidas en curso sin necesidad de cuentas ni login.
 */

const STORAGE_KEY = 'ajedrito_local_games';

export function getLocalGames(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[GameStorage] Error leyendo localStorage:', err);
    return [];
  }
}

export function saveLocalGame(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalGames();
    if (!current.includes(gameId)) {
      const updated = [gameId, ...current].slice(0, 20); // Guardar hasta 20 partidas recientes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('[GameStorage] Error guardando en localStorage:', err);
  }
}

export function removeLocalGame(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalGames();
    const updated = current.filter((id) => id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[GameStorage] Error eliminando de localStorage:', err);
  }
}
