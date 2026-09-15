'use client';

import { ArrowLeft } from 'lucide-react';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';
import { BOARD_THEME } from '@/constants/chess';

interface GameBoardProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  isDraggable: boolean;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onReturnToMenu?: () => void;
  returnButtonLabel?: string;
}

export default function GameBoard({
  fen,
  boardOrientation,
  isDraggable,
  onPieceDrop,
  onReturnToMenu,
  returnButtonLabel = 'Cambiar modalidad / Volver al menú',
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Contenedor del Tablero */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-lg border border-[#E5E7EB] flex items-center justify-center">
        <div
          id="ajedrito-board"
          className="w-[min(480px,58vh)] aspect-square rounded-2xl overflow-hidden shadow-sm"
        >
          <Chessboard
            options={{
              position: fen,
              onPieceDrop,
              boardOrientation,
              allowDragging: isDraggable,
              boardStyle: {
                borderRadius: BOARD_THEME.borderRadius,
              },
              darkSquareStyle: { backgroundColor: BOARD_THEME.darkSquareColor },
              lightSquareStyle: { backgroundColor: BOARD_THEME.lightSquareColor },
            }}
          />
        </div>
      </div>

      {/* Botón Volver al Menú */}
      {onReturnToMenu && (
        <button
          type="button"
          onClick={onReturnToMenu}
          className="px-5 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#233E31] text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> {returnButtonLabel}
        </button>
      )}
    </div>
  );
}
