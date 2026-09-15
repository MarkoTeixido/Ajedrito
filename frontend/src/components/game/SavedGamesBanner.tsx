'use client';

import { ArrowRight } from 'lucide-react';
import { type GameStateResponse } from '@/lib/api';

interface SavedGamesBannerProps {
  savedGames: GameStateResponse[];
  onResumeGame: (gameId: string) => void;
}

export default function SavedGamesBanner({
  savedGames,
  onResumeGame,
}: SavedGamesBannerProps) {
  if (savedGames.length === 0) return null;

  const latestGame = savedGames[0];

  return (
    <div className="w-full rounded-2xl border border-[#E5E7EB] bg-white/90 px-4 py-2.5 shadow-2xs flex items-center justify-between text-xs animate-in fade-in">
      <span className="text-xs text-[#4A5568]">
        Partida en curso guardada (<strong>{latestGame.moves.length}</strong> jugadas)
      </span>
      <button
        type="button"
        onClick={() => onResumeGame(latestGame.game.id)}
        className="font-bold text-[#233E31] hover:underline cursor-pointer flex items-center gap-1 text-xs"
      >
        Reanudar <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
