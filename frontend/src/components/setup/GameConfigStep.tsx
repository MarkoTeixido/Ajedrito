'use client';

import { ArrowLeft, ArrowRight, Loader2, Users, Bot, BrainCircuit } from 'lucide-react';
import { type GameMode, type DifficultyProfile } from '@/lib/api';

interface GameConfigStepProps {
  selectedMode: GameMode;
  selectedDifficultyId: string | null;
  selectedColor: 'white' | 'black' | null;
  profiles: DifficultyProfile[];
  isStartingGame: boolean;
  canStartGame: boolean;
  onBack: () => void;
  onSelectDifficulty: (id: string) => void;
  onSelectColor: (color: 'white' | 'black') => void;
  onStartGame: () => void;
}

const STOCKFISH_LEVELS = [
  { name: 'Principiante', elo: '~ 800 ELO' },
  { name: 'Intermedio', elo: '~ 1500 ELO' },
  { name: 'Avanzado', elo: '~ 2200 ELO' },
  { name: 'Experto', elo: '~ 3190 ELO' },
];

export default function GameConfigStep({
  selectedMode,
  selectedDifficultyId,
  selectedColor,
  profiles,
  isStartingGame,
  canStartGame,
  onBack,
  onSelectDifficulty,
  onSelectColor,
  onStartGame,
}: GameConfigStepProps) {
  return (
    <div className="w-full rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-7 md:p-8 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-right-3 duration-200">
      {/* Barra superior para volver a las modalidades */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F1F3F5]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#3B5B4C] hover:text-[#1C3026] transition cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Elegir otra modalidad</span>
        </button>
        <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F4F5F2] px-2.5 py-0.5 rounded-full">
          Paso 2 de 2
        </span>
      </div>

      {/* Resumen de la modalidad elegida */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
            selectedMode === 'PVP'
              ? 'bg-[#DDEAE1] text-[#233E31]'
              : selectedMode === 'PV_STOCKFISH'
              ? 'bg-[#E0EFF8] text-[#1E4C6D]'
              : 'bg-[#EFE4EE] text-[#6B2F5C]'
          }`}
        >
          {selectedMode === 'PVP' ? (
            <Users className="w-5 h-5 stroke-[2.2]" />
          ) : selectedMode === 'PV_STOCKFISH' ? (
            <Bot className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <BrainCircuit className="w-5 h-5 stroke-[2.2]" />
          )}
        </div>
        <div>
          <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#1C3026] leading-tight">
            {selectedMode === 'PVP'
              ? 'Jugador vs Jugador'
              : selectedMode === 'PV_STOCKFISH'
              ? 'Jugador vs Stockfish'
              : 'Jugar vs Ajedrito IA'}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {selectedMode === 'PVP'
              ? 'Partida hotseat en el mismo dispositivo'
              : selectedMode === 'PV_STOCKFISH'
              ? 'Elegí la dificultad y tus piezas'
              : 'Configurá tu bando frente a la IA'}
          </p>
        </div>
      </div>

      {/* 1. Selector de Dificultad (Solo Stockfish) */}
      {selectedMode === 'PV_STOCKFISH' && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#2D3748]">Seleccioná la dificultad</span>
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#F4F5F2] border border-[#E2E8F0]">
            {STOCKFISH_LEVELS.map((level) => {
              const profileMatch = profiles.find((p) => p.name === level.name);
              const isSelected = profileMatch ? selectedDifficultyId === profileMatch.id : false;

              return (
                <button
                  key={level.name}
                  type="button"
                  onClick={() => profileMatch && onSelectDifficulty(profileMatch.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#233E31] text-white shadow-xs font-semibold'
                      : 'text-[#4A5568] hover:bg-white hover:text-[#1C3026]'
                  }`}
                >
                  <span className="text-xs leading-tight">{level.name}</span>
                  <span
                    className={`text-[10px] mt-0.5 leading-none ${
                      isSelected ? 'text-[#E2E8F0]' : 'text-[#718096]'
                    }`}
                  >
                    {level.elo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Selector de Bando (Blancas o Negras) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-[#2D3748]">
          {selectedMode === 'PVP' ? '¿Con qué piezas juega el Jugador 1?' : 'Seleccioná tu bando'}
        </span>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F4F5F2] border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => onSelectColor('white')}
            className={`flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedColor === 'white'
                ? 'bg-[#233E31] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-white hover:text-[#1C3026]'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-white border border-[#CBD5E1] shadow-xs inline-block" />
            Blancas (inicia)
          </button>
          <button
            type="button"
            onClick={() => onSelectColor('black')}
            className={`flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedColor === 'black'
                ? 'bg-[#233E31] text-white shadow-xs'
                : 'text-[#4A5568] hover:bg-white hover:text-[#1C3026]'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#1E293B] border border-[#0F172A] shadow-xs inline-block" />
            Negras
          </button>
        </div>
      </div>

      {/* Botón Principal: Comenzar partida */}
      <button
        type="button"
        onClick={onStartGame}
        disabled={!canStartGame || isStartingGame}
        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-md mt-1 ${
          canStartGame && !isStartingGame
            ? 'bg-[#233E31] hover:bg-[#1A3026] text-white cursor-pointer active:scale-[0.99]'
            : 'bg-[#CBD5E1] text-[#64748B] cursor-not-allowed opacity-60'
        }`}
      >
        {isStartingGame ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparando tablero…
          </span>
        ) : (
          <>
            <span>Comenzar partida</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </>
        )}
      </button>
    </div>
  );
}
