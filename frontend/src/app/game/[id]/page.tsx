'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';
import { useRouter } from 'next/navigation';
import { getGame, makeMove, type MoveRecord } from '@/lib/api';

const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const RESULT_LABELS: Record<string, string> = {
  WHITE_WINS: '🏆 ¡Ganan las Blancas!',
  BLACK_WINS: '🏆 ¡Ganan las Negras!',
  DRAW: '🤝 ¡Tablas!',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const router = useRouter();

  // chess.js instance — fuente de verdad del estado del tablero
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('IN_PROGRESS');
  const [isCheck, setIsCheck] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(
    'white',
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Historial de jugadas scrollable — siempre al final
  const historyEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  // Cargar estado inicial de la partida
  useEffect(() => {
    getGame(gameId)
      .then(({ game, moves }) => {
        const fen = game.currentFen || INITIAL_FEN;
        chessRef.current.load(fen);
        setFen(fen);
        setMoveHistory(moves);
        setIsGameOver(game.result !== 'IN_PROGRESS');
        setGameResult(game.result);
      })
      .catch(() => setLoadError('No se pudo cargar la partida'))
      .finally(() => setLoading(false));
  }, [gameId]);

  // Manejar el drop de una pieza en el tablero
  const onPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (isGameOver || !targetSquare) return false;

      const chess = chessRef.current;

      // Evitar que el color equivocado mueva (PVP hotseat)
      const pieceColor = piece.pieceType[0]; // 'w' o 'b'
      if (chess.turn() !== pieceColor) return false;

      // Validar localmente antes de llamar al backend
      const tempChess = new Chess(chess.fen());
      let localMove;
      try {
        localMove = tempChess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // auto-promoción a reina por ahora
        });
      } catch {
        return false;
      }
      if (!localMove) return false;

      // Actualización optimista: el tablero se mueve de inmediato
      const prevFen = chess.fen();
      chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      setFen(chess.fen());
      setIsCheck(chess.isCheck());

      // Sincronizar con el backend (persiste la jugada en DB)
      makeMove(gameId, sourceSquare, targetSquare)
        .then((data) => {
          // Sincronizar FEN del servidor (fuente de verdad)
          chess.load(data.newFen);
          setFen(data.newFen);
          setIsCheck(data.isCheck);
          setMoveHistory((prev) => [...prev, data.move]);

          if (data.isGameOver) {
            setIsGameOver(true);
            setGameResult(data.result);
          }
        })
        .catch(() => {
          // Rollback si el backend rechaza la jugada
          chess.load(prevFen);
          setFen(prevFen);
          setIsCheck(false);
        });

      return true; // aceptar el drop
    },
    [gameId, isGameOver],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-400 animate-pulse text-lg">Cargando partida…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{loadError}</p>
        <button
          onClick={() => router.push('/')}
          className="text-indigo-400 hover:underline"
        >
          ← Volver al inicio
        </button>
      </div>
    );
  }

  const chess = chessRef.current;
  const turn = chess.turn() === 'w' ? 'white' : 'black';
  const turnLabel =
    turn === 'white' ? '♙ Turno: Blancas' : '♟ Turno: Negras';

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">♟</span>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">Ajedrito</h1>
          <p className="text-sm text-gray-400">Jugador vs Jugador</p>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-5xl">
        {/* Columna izquierda: tablero */}
        <div className="flex flex-col items-center gap-3">
          {/* Indicador de turno / estado */}
          {isGameOver ? (
            <div className="px-5 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 font-semibold text-base">
              {RESULT_LABELS[gameResult] ?? 'Partida terminada'}
            </div>
          ) : (
            <div
              className={`px-5 py-2 rounded-xl border font-medium text-base transition ${
                isCheck
                  ? 'bg-red-500/20 border-red-400/50 text-red-300 animate-pulse'
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
            >
              {isCheck && '⚠️ ¡Jaque!  '}{turnLabel}
            </div>
          )}

          {/* Tablero */}
          <div id="pvp-board" className="w-[480px] max-w-full aspect-square rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
            <Chessboard
              options={{
                position: fen,
                onPieceDrop,
                boardOrientation,
                allowDragging: !isGameOver,
                boardStyle: {
                  borderRadius: '8px',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                },
                darkSquareStyle: { backgroundColor: '#4a5568' },
                lightSquareStyle: { backgroundColor: '#cbd5e0' },
              }}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-1">
            <button
              id="btn-flip-board"
              onClick={() =>
                setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))
              }
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition"
            >
              🔄 Girar tablero
            </button>
            <button
              id="btn-back-home"
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition"
            >
              ← Menú
            </button>
          </div>
        </div>

        {/* Columna derecha: historial */}
        <div className="flex flex-col gap-3 w-52">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
            Historial de jugadas
          </h2>

          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 h-80 overflow-y-auto text-sm">
            {moveHistory.length === 0 ? (
              <p className="text-gray-600 text-center mt-8">Sin jugadas aún</p>
            ) : (
              <table className="w-full">
                <tbody>
                  {Array.from(
                    { length: Math.ceil(moveHistory.length / 2) },
                    (_, i) => {
                      const white = moveHistory[i * 2];
                      const black = moveHistory[i * 2 + 1];
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-700/40 last:border-0"
                        >
                          <td className="py-1 pr-2 text-gray-500 w-6 text-right">
                            {i + 1}.
                          </td>
                          <td className="py-1 pr-3 text-white font-mono">
                            {white?.san}
                          </td>
                          <td className="py-1 text-gray-400 font-mono">
                            {black?.san ?? ''}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            )}
            <div ref={historyEndRef} />
          </div>

          <p className="text-xs text-gray-600 text-center font-mono">
            {gameId.slice(0, 8)}…
          </p>
        </div>
      </div>
    </div>
  );
}
