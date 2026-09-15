'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AjedritoHeader from '@/components/AjedritoHeader';
import DecorativeFooter from '@/components/DecorativeFooter';
import PromotionModal from '@/components/PromotionModal';
import GameResultModal from '@/components/GameResultModal';
import GameBoard from '@/components/board/GameBoard';
import GameSidebar from '@/components/game/GameSidebar';
import { useChessGame } from '@/hooks/useChessGame';
import { getGame, createGame, type GameMode } from '@/lib/api';
import { saveLocalGame } from '@/lib/gameStorage';
import { INITIAL_FEN } from '@/constants/chess';

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const router = useRouter();

  const [gameMode, setGameMode] = useState<GameMode>('PVP');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [humanColor, setHumanColor] = useState<'white' | 'black' | null>(null);
  const [difficultyName, setDifficultyName] = useState<string | null>(null);
  const [difficultyProfileId, setDifficultyProfileId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStartingRematch, setIsStartingRematch] = useState(false);

  // Hook de lógica de juego, chess.js y WebSockets
  const {
    fen,
    moveHistory,
    isGameOver,
    gameResult,
    isCheck,
    isOpponentThinking,
    currentTurn,
    isDraggable,
    pendingPromotion,
    showResultModal,
    setShowResultModal,
    loadPosition,
    onPieceDrop,
    handleSelectPromotion,
    cancelPromotion,
  } = useChessGame({
    gameId,
    gameMode,
    humanColor,
  });

  // Cargar estado inicial de la partida
  useEffect(() => {
    getGame(gameId)
      .then(({ game, moves }) => {
        saveLocalGame(gameId);

        const initialFen = game.currentFen || INITIAL_FEN;
        const gameOver = game.result !== 'IN_PROGRESS';
        loadPosition(initialFen, moves, gameOver, game.result);

        setGameMode(game.mode);

        if (game.mode === 'PVP') {
          setHumanColor(null);
          setBoardOrientation('white');
        } else if (game.whiteType === 'HUMAN') {
          setHumanColor('white');
          setBoardOrientation('white');
        } else {
          setHumanColor('black');
          setBoardOrientation('black');
        }

        if (game.difficultyProfile) {
          setDifficultyName(game.difficultyProfile.name);
          setDifficultyProfileId(game.difficultyProfile.id);
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar la partida');
      })
      .finally(() => setLoading(false));
  }, [gameId, loadPosition]);

  // ── Revancha: Crear nueva partida y navegar ─────────────────────────────────
  const handleRematch = async () => {
    setIsStartingRematch(true);
    try {
      const newGame = await createGame(
        gameMode,
        difficultyProfileId,
        humanColor || 'white',
      );
      saveLocalGame(newGame.gameId);
      router.push(`/game/${newGame.gameId}`);
    } catch (err) {
      alert('❌ Ocurrió un error al iniciar la revancha.');
      console.error(err);
      setIsStartingRematch(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0]">
        <AjedritoHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#233E31]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-bold">Cargando tablero y partida…</span>
          </div>
        </main>
        <DecorativeFooter />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0]">
        <AjedritoHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#FCA5A5] bg-white p-7 shadow-lg flex flex-col items-center text-center gap-4">
            <h2 className="font-serif-title text-xl font-bold text-[#991B1B]">
              No se pudo cargar la partida
            </h2>
            <p className="text-sm text-[#4A5568]">{loadError}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl bg-[#233E31] text-white font-bold text-xs hover:bg-[#1A3026] transition"
            >
              Volver al inicio
            </button>
          </div>
        </main>
        <DecorativeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0]">
      <AjedritoHeader />

      <main className="flex-1 min-h-0 flex justify-center max-w-7xl mx-auto w-full z-10 relative px-4 items-start pt-1 sm:pt-2 md:pt-4 pb-8">
        <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-6 lg:gap-10 animate-in fade-in duration-300">
          <GameBoard
            fen={fen}
            boardOrientation={boardOrientation}
            isDraggable={isDraggable}
            onPieceDrop={onPieceDrop}
            onReturnToMenu={() => router.push('/')}
            returnButtonLabel="Volver al menú principal"
          />

          <GameSidebar
            gameMode={gameMode}
            difficultyName={difficultyName}
            isGameOver={isGameOver}
            gameResult={gameResult}
            isCheck={isCheck}
            currentTurn={currentTurn}
            isOpponentThinking={isOpponentThinking}
            moves={moveHistory}
            onShowResultModal={() => setShowResultModal(true)}
          />
        </div>
      </main>

      {/* Modal de Coronación de Peón */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={handleSelectPromotion}
          onCancel={cancelPromotion}
        />
      )}

      {/* Modal de Fin de Partida */}
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        onNewGame={() => router.push('/')}
        onRematch={handleRematch}
        result={gameResult}
        gameMode={gameMode}
        humanSide={humanColor}
        moveCount={moveHistory.length}
        difficultyName={difficultyName}
        gameId={gameId}
        isLoadingRematch={isStartingRematch}
      />

      <DecorativeFooter />
    </div>
  );
}
