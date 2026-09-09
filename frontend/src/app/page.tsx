'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const startPvP = async () => {
    setLoading('pvp');
    try {
      const data = await createGame('PVP');
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      alert(
        '❌ No se pudo crear la partida. ¿Está el backend corriendo en localhost:3001?',
      );
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
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

        {/* Stockfish — próximamente */}
        <button
          id="btn-stockfish"
          disabled
          className="w-64 rounded-2xl border border-gray-700/40 bg-gray-800/40 px-6 py-5 text-left cursor-not-allowed opacity-50"
        >
          <span className="block text-2xl mb-1">🤖</span>
          <span className="block font-semibold text-gray-400">vs Stockfish</span>
          <span className="block text-sm text-gray-500 mt-1">Próximamente (Iteración 3)</span>
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
        Iteración 2 — Modo PVP activo ✓
      </p>
    </main>
  );
}
