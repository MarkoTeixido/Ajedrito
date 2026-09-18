'use client';

import { Users, Bot, BrainCircuit, ArrowRight } from 'lucide-react';
import { type GameMode } from '@/lib/api';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="w-full rounded-3xl border border-[#E5E7EB] bg-white p-5 sm:p-7 md:p-8 shadow-sm flex flex-col gap-3.5 sm:gap-5 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="font-serif-title text-xl sm:text-2xl md:text-3xl font-bold text-[#1C3026]">
          Elegí tu modalidad
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 sm:mt-1">Seleccioná cómo querés jugar</p>
      </div>

      {/* Botones de Modalidad */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* 1. Jugador vs Jugador */}
        <button
          type="button"
          onClick={() => onSelectMode('PVP')}
          className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#3B5B4C] hover:bg-[#F2F7F4] hover:shadow-xs transition text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#DDEAE1] flex items-center justify-center flex-shrink-0 text-[#233E31] shadow-2xs group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                Jugador vs Jugador
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">En la misma PC</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] group-hover:text-[#233E31] group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
        </button>

        {/* 2. Jugador vs Stockfish */}
        <button
          type="button"
          onClick={() => onSelectMode('PV_STOCKFISH')}
          className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#1E4C6D] hover:bg-[#F0F7FA] hover:shadow-xs transition text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#E0EFF8] flex items-center justify-center flex-shrink-0 text-[#1E4C6D] shadow-2xs group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                Jugador vs Stockfish
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">Desafiá al motor de ajedrez</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] group-hover:text-[#1E4C6D] group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
        </button>

        {/* 3. Jugar vs Ajedrito IA */}
        <button
          type="button"
          onClick={() => onSelectMode('PV_AI')}
          className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#6B2F5C] hover:bg-[#FAF4F9] hover:shadow-xs transition text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EFE4EE] flex items-center justify-center flex-shrink-0 text-[#6B2F5C] shadow-2xs group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                Jugar vs Ajedrito IA
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">Una IA que aprende de tus partidas</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] group-hover:text-[#6B2F5C] group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
        </button>
      </div>
    </div>
  );
}
