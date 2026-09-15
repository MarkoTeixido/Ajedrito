'use client';

import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Eye,
  Handshake,
  Frown,
  Sparkles,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react';

interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame?: () => void;
  onRematch?: () => void;
  onRestart?: () => void; // Fallback compatible
  result: string;
  gameMode: 'PVP' | 'PV_STOCKFISH' | 'PV_AI';
  humanSide: 'white' | 'black' | null;
  moveCount: number;
  difficultyName?: string | null;
  gameId?: string;
  isLoadingRematch?: boolean;
}

export function fireVictoryConfetti() {
  const colors = ['#D9A74A', '#233E31', '#879D8B', '#FAF9F5', '#C5A059'];

  confetti({
    particleCount: 45,
    angle: 60,
    spread: 55,
    origin: { x: 0.1, y: 0.65 },
    colors,
    disableForReducedMotion: true,
  });

  confetti({
    particleCount: 45,
    angle: 120,
    spread: 55,
    origin: { x: 0.9, y: 0.65 },
    colors,
    disableForReducedMotion: true,
  });

  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.55 },
      colors,
      disableForReducedMotion: true,
    });
  }, 220);
}

export default function GameResultModal({
  isOpen,
  onClose,
  onNewGame,
  onRematch,
  onRestart,
  result,
  gameMode,
  humanSide,
  moveCount,
  difficultyName,
  gameId,
  isLoadingRematch = false,
}: GameResultModalProps) {
  const [mounted, setMounted] = useState(false);
  // Rastreo para que el confeti solo se dispare UNA vez por partida
  const firedConfettiKeyRef = useRef<string | null>(null);

  // Determinar el resultado desde la perspectiva del jugador
  const isPVP = gameMode === 'PVP';
  const isDraw = result === 'DRAW';
  const isWhiteWin = result === 'WHITE_WINS';
  const isBlackWin = result === 'BLACK_WINS';

  const isHumanWinner =
    !isDraw &&
    ((humanSide === 'white' && isWhiteWin) ||
      (humanSide === 'black' && isBlackWin));

  const isOpponentWinner =
    !isDraw &&
    !isPVP &&
    ((humanSide === 'white' && isBlackWin) ||
      (humanSide === 'black' && isWhiteWin));

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const currentGameKey = gameId || `${result}-${moveCount}`;
      if (
        (isHumanWinner || (isPVP && !isDraw)) &&
        firedConfettiKeyRef.current !== currentGameKey
      ) {
        firedConfettiKeyRef.current = currentGameKey;
        const timer = setTimeout(() => {
          fireVictoryConfetti();
        }, 150);
        return () => clearTimeout(timer);
      }
    } else {
      setMounted(false);
    }
  }, [isOpen, isHumanWinner, isPVP, isDraw, gameId, result, moveCount]);

  if (!isOpen && !mounted) return null;

  // Textos y estilos dinámicos
  let title = 'Partida finalizada';
  let subtitle = 'La partida ha concluido.';
  let themeBadge = 'bg-[#F4F5F2] text-[#233E31] border-[#E2E8F0]';
  let iconElement = <Trophy className="w-8 h-8 text-[#D9A74A]" />;

  if (isDraw) {
    title = 'Tablas';
    subtitle = 'Empate acordado o posición sin movimientos legales.';
    themeBadge = 'bg-[#EBF3F5] text-[#2C5254] border-[#BDD8DC]';
    iconElement = <Handshake className="w-8 h-8 text-[#5F979A]" />;
  } else if (isHumanWinner) {
    title = '¡Victoria magistral!';
    subtitle =
      gameMode === 'PV_STOCKFISH'
        ? `Superaste a Stockfish (${difficultyName || 'Motor'}) con solvencia.`
        : 'Superaste a la IA de Ajedrito. ¡Excelente partida!';
    themeBadge = 'bg-[#F3F9F4] text-[#1E4533] border-[#B7DECE]';
    iconElement = <Trophy className="w-8 h-8 text-[#D9A74A]" />;
  } else if (isOpponentWinner) {
    title = 'Jaque Mate';
    subtitle =
      gameMode === 'PV_STOCKFISH'
        ? `Stockfish (${difficultyName || 'Motor'}) logró la ventaja decisiva.`
        : 'Ajedrito IA completó la partida a su favor.';
    themeBadge = 'bg-[#F7F4F0] text-[#7C6959] border-[#E8DFD5]';
    iconElement = <Frown className="w-9 h-9 text-[#8C7362]" strokeWidth={2} />;
  } else if (isPVP) {
    title = isWhiteWin ? '¡Ganan las Blancas!' : '¡Ganan las Negras!';
    subtitle = 'Gran enfrentamiento entre ambos jugadores en la misma PC.';
    themeBadge = 'bg-[#F3F9F4] text-[#1E4533] border-[#B7DECE]';
    iconElement = <Trophy className="w-8 h-8 text-[#D9A74A]" />;
  }

  // Etiqueta dinámica para el botón de revancha
  let rematchLabel = 'Revancha';
  if (gameMode === 'PV_STOCKFISH') {
    rematchLabel = `Revancha con Stockfish ${difficultyName ? `(${difficultyName})` : ''}`;
  } else if (gameMode === 'PV_AI') {
    rematchLabel = 'Revancha con Ajedrito IA';
  } else if (gameMode === 'PVP') {
    rematchLabel = 'Revancha (Jugador vs Jugador)';
  }

  const handleNewGameAction = () => {
    if (onNewGame) {
      onNewGame();
    } else if (onRestart) {
      onRestart();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen
          ? 'bg-black/35 backdrop-blur-[2px] opacity-100'
          : 'bg-transparent pointer-events-none opacity-0'
      }`}
    >
      <div
        className={`w-full max-w-[420px] rounded-3xl border border-[#E5E7EB] bg-white p-7 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4 sm:gap-5 transition-all duration-300 transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Ícono de resultado con anillo de resplandor */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-18 h-18 rounded-3xl border flex items-center justify-center shadow-xs ${themeBadge}`}
          >
            {iconElement}
          </div>
          {isHumanWinner && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-5 h-5 text-[#D9A74A] animate-spin-slow" />
            </div>
          )}
        </div>

        {/* Títulos y explicación */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">
            {isDraw
              ? 'Resultado parejo'
              : isHumanWinner || isPVP
              ? 'Fin de partida'
              : 'Fin de partida'}
          </span>
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C3026] leading-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5568] max-w-xs mx-auto mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Resumen de estadísticas breves */}
        <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#F6F5F0] border border-[#E2E8F0] text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#718096] uppercase font-bold tracking-wider">
              Jugadas
            </span>
            <span className="font-mono font-bold text-sm text-[#1C3026]">
              {moveCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#718096] uppercase font-bold tracking-wider">
              Modalidad
            </span>
            <span className="font-bold text-xs text-[#1C3026] truncate">
              {gameMode === 'PVP'
                ? 'Jugador vs Jugador'
                : gameMode === 'PV_STOCKFISH'
                ? `Stockfish (${difficultyName || 'Motor'})`
                : 'Ajedrito IA'}
            </span>
          </div>
        </div>

        {/* Cita de ajedrez en caso de derrota (elegante y reflexivo) */}
        {isOpponentWinner && (
          <p className="text-[11px] italic text-[#718096] border-l-2 border-[#CBD5E1] pl-3 text-left py-0.5">
            «Las derrotas son la semilla de las próximas victorias.»
          </p>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col w-full gap-2.5 pt-1">
          {/* 1. Revancha con el modo actual */}
          {onRematch && (
            <button
              type="button"
              onClick={onRematch}
              disabled={isLoadingRematch}
              className="w-full py-3 px-4 rounded-2xl bg-[#233E31] hover:bg-[#1A3026] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-between gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isLoadingRematch ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <RotateCcw className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{rematchLabel}</span>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 ml-1 text-white/80" />
            </button>
          )}

          {/* 2. Nueva partida */}
          <button
            type="button"
            onClick={handleNewGameAction}
            className="w-full py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#233E31] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5 text-[#233E31]" />
            <span>Nueva partida</span>
          </button>

          {/* 3. Ver tablero y jugadas finales */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-[#64748B] hover:text-[#233E31] hover:bg-black/5 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Ver tablero y jugadas finales</span>
          </button>
        </div>
      </div>
    </div>
  );
}
