export default function Home() {
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
        <button
          id="btn-pvp"
          className="w-64 rounded-2xl border border-gray-700 bg-gray-800 px-6 py-5 text-left transition hover:border-indigo-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="block text-2xl mb-1">👥</span>
          <span className="block font-semibold text-white">Jugador vs Jugador</span>
          <span className="block text-sm text-gray-400 mt-1">Dos jugadores en el mismo dispositivo</span>
        </button>

        <button
          id="btn-stockfish"
          className="w-64 rounded-2xl border border-gray-700 bg-gray-800 px-6 py-5 text-left transition hover:border-emerald-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <span className="block text-2xl mb-1">🤖</span>
          <span className="block font-semibold text-white">vs Stockfish</span>
          <span className="block text-sm text-gray-400 mt-1">Motor de ajedrez clásico (UCI)</span>
        </button>

        <button
          id="btn-ai"
          className="w-64 rounded-2xl border border-gray-700 bg-gray-800 px-6 py-5 text-left transition hover:border-purple-500 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <span className="block text-2xl mb-1">🧠</span>
          <span className="block font-semibold text-white">vs IA Propia</span>
          <span className="block text-sm text-gray-400 mt-1">Modelo entrenado con partidas guardadas</span>
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-4">
        Iteración 1 — estructura base activa ✓
      </p>
    </main>
  );
}
