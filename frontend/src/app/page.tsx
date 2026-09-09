'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame, getDifficultyProfiles, type DifficultyProfile } from '@/lib/api';

const PROFILE_BADGES: Record<string, { desc: string; icon: string; color: string }> = {
  Principiante: { desc: 'Ideal para aprender o practicar jugadas.', icon: '🌱', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' },
  Intermedio: { desc: 'Juega con solidez táctica básica.', icon: '⚔️', color: 'border-blue-500/40 bg-blue-950/20 text-blue-300' },
  Avanzado: { desc: 'Profundidad de cálculo y estrategia exigente.', icon: '🔥', color: 'border-orange-500/40 bg-orange-950/20 text-orange-300' },
  Experto: { desc: 'Fuerza máxima del motor a profundidad 20.', icon: '👑', color: 'border-red-500/40 bg-red-950/20 text-red-300' },
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Estado del modal de Stockfish
  const [showStockfishModal, setShowStockfishModal] = useState(false);
  const [profiles, setProfiles] = useState<DifficultyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const startPvP = async () => {
    setLoading('pvp');
    try {
      const data = await createGame('PVP');
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      alert('❌ No se pudo crear la partida. ¿Está el backend corriendo en localhost:3001?');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleOpenStockfishModal = async () => {
    setShowStockfishModal(true);
    setLoadingProfiles(true);
    try {
      const fetched = await getDifficultyProfiles('STOCKFISH');
      setProfiles(fetched);
      if (fetched.length > 0) {
        setSelectedProfileId(fetched[0].id);
      }
    } catch (err) {
      console.error('Error al obtener perfiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const startStockfishGame = async () => {
    if (!selectedProfileId) return;
    setLoading('stockfish');
    try {
      const data = await createGame('PV_STOCKFISH', selectedProfileId);
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      alert('❌ No se pudo iniciar la partida contra Stockfish. ¿Está el backend corriendo?');
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 relative">
      {/* Logo / título */}
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white">
          ♟ Ajedrito
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          Sistema de ajedrez web · Modelos y Simulación
        </p>
      </div>

      {/* Modos de juego */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        {/* PVP — activo */}
        <button
          id="btn-pvp"
          onClick={startPvP}
          disabled={loading === 'pvp'}
          className="w-64 rounded-2xl border border-gray-700 bg-gray-800 px-6 py-5 text-left transition
            hover:border-indigo-500 hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="block text-2xl mb-1">
            {loading === 'pvp' ? '⏳' : '👥'}
          </span>
          <span className="block font-semibold text-white">Jugador vs Jugador</span>
          <span className="block text-sm text-gray-400 mt-1">
            Dos jugadores en el mismo dispositivo
          </span>
        </button>

        {/* Stockfish — activo */}
        <button
          id="btn-stockfish"
          onClick={handleOpenStockfishModal}
          disabled={loading === 'stockfish'}
          className="w-64 rounded-2xl border border-gray-700 bg-gray-800 px-6 py-5 text-left transition
            hover:border-emerald-500 hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="block text-2xl mb-1">
            {loading === 'stockfish' ? '⏳' : '🤖'}
          </span>
          <span className="block font-semibold text-white">vs Stockfish</span>
          <span className="block text-sm text-gray-400 mt-1">
            Motor UCI con niveles configurables
          </span>
        </button>

        {/* IA propia — próximamente */}
        <button
          id="btn-ai"
          disabled
          className="w-64 rounded-2xl border border-gray-700/40 bg-gray-800/40 px-6 py-5 text-left cursor-not-allowed opacity-50"
        >
          <span className="block text-2xl mb-1">🧠</span>
          <span className="block font-semibold text-gray-400">vs IA Propia</span>
          <span className="block text-sm text-gray-500 mt-1">Próximamente (Iteración 4)</span>
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-4">
        Iteración 3 — Modos PVP y Stockfish activos ✓
      </p>

      {/* Modal de selección de dificultad Stockfish */}
      {showStockfishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-bold text-white">Dificultad de Stockfish</h2>
              </div>
              <button
                onClick={() => setShowStockfishModal(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400">
              Selecciona el nivel del motor antes de iniciar la partida:
            </p>

            {loadingProfiles ? (
              <div className="py-8 text-center text-gray-400 animate-pulse">
                Cargando niveles de dificultad…
              </div>
            ) : profiles.length === 0 ? (
              <div className="py-6 text-center text-red-400 text-sm">
                No se pudieron cargar los perfiles desde el servidor. ¿Está el backend encendido?
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {profiles.map((p) => {
                  const badge = PROFILE_BADGES[p.name] || {
                    desc: `Nivel ${p.skillLevel} · Profundidad ${p.searchDepth}`,
                    icon: '🎯',
                    color: 'border-gray-700 bg-gray-800 text-gray-300',
                  };
                  const isSelected = selectedProfileId === p.id;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileId(p.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/50'
                          : 'border-gray-800 bg-gray-800/60 hover:border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{badge.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{p.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-md border font-mono ${badge.color}`}>
                            Nivel {p.skillLevel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{badge.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowStockfishModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={startStockfishGame}
                disabled={!selectedProfileId || loading === 'stockfish'}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                {loading === 'stockfish' ? 'Iniciando…' : 'Comenzar partida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
