'use client';

import {
  Trophy,
  Handshake,
  AlertTriangle,
  Loader2,
  Brain,
  Bot,
  Users,
} from 'lucide-react';
import { type GameMode, type MoveRecord } from '@/lib/api';
import { RESULT_LABELS } from '@/constants/chess';
import MoveHistory from './MoveHistory';

interface GameSidebarProps {
  gameMode: GameMode;
  difficultyName: string | null;
  isGameOver: boolean;
  gameResult: string;
  isCheck: boolean;
  currentTurn: 'white' | 'black';
  isOpponentThinking: boolean;
  moves: MoveRecord[];
  onShowResultModal: () => void;
}

export default function GameSidebar({
  gameMode,
  difficultyName,
  isGameOver,
  gameResult,
  isCheck,
  currentTurn,
  isOpponentThinking,
  moves,
  onShowResultModal,
}: GameSidebarProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-md flex flex-col gap-4 max-h-[min(520px,62vh)]">
      {/* Encabezado del modo de juego */}
      <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
        <div>
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            Partida en curso
          </span>
          <h3 className="font-serif-title text-lg font-bold text-[#1C3026] mt-0.5">
            {gameMode === 'PVP'
              ? 'Jugador vs Jugador'
              : gameMode === 'PV_STOCKFISH'
              ? `vs Stockfish · ${difficultyName || 'Intermedio'}`
              : 'vs Ajedrito IA'}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
          {gameMode === 'PV_STOCKFISH' ? (
            <Bot className="w-5 h-5 text-[#1E4C6D]" />
          ) : gameMode === 'PV_AI' ? (
            <Brain className="w-5 h-5 text-[#6B2F5C]" />
          ) : (
            <Users className="w-5 h-5 text-[#233E31]" />
          )}
        </div>
      </div>

      {/* Estado del turno / Jaque / Final */}
      {isGameOver ? (
        <div className="flex flex-col gap-2">
          <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-sm text-center flex items-center justify-center gap-2">
            {gameResult === 'DRAW' ? (
              <Handshake className="w-4 h-4" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            {RESULT_LABELS[gameResult] ?? 'Partida terminada'}
          </div>
          <button
            type="button"
            onClick={onShowResultModal}
            className="w-full py-2 px-3 rounded-xl bg-[#233E31]/10 hover:bg-[#233E31]/15 text-[#233E31] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#D9A74A]" />
            Ver resultado detallado
          </button>
        </div>
      ) : isOpponentThinking ? (
        <div className="p-3 rounded-xl bg-[#E0EFF8] border border-[#BAE6FD] text-[#0369A1] font-bold text-sm text-center animate-pulse flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {gameMode === 'PV_AI' ? 'Ajedrito IA pensando…' : 'Stockfish calculando…'}
        </div>
      ) : (
        <div
          className={`p-3 rounded-xl border text-sm font-bold text-center transition flex items-center justify-center gap-2 ${
            isCheck
              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B] animate-pulse'
              : 'bg-[#F4F5F2] border-[#E2E8F0] text-[#233E31]'
          }`}
        >
          {isCheck && <AlertTriangle className="w-4 h-4 text-[#991B1B]" />}
          <span
            className={`w-3.5 h-3.5 rounded-full inline-block ${
              currentTurn === 'white'
                ? 'bg-white border border-[#CBD5E1] shadow-2xs'
                : 'bg-[#1E293B]'
            }`}
          />
          {isCheck && '¡Jaque! · '}Turno de {currentTurn === 'white' ? 'Blancas' : 'Negras'}
        </div>
      )}

      {/* Historial de jugadas */}
      <MoveHistory moves={moves} />
    </div>
  );
}
