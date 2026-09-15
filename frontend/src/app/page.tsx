'use client';

import { useState } from 'react';
import AjedritoHeader from '@/components/AjedritoHeader';
import DecorativeFooter from '@/components/DecorativeFooter';
import PromotionModal from '@/components/PromotionModal';
import GameResultModal from '@/components/GameResultModal';
import ModeSelector from '@/components/setup/ModeSelector';
import GameConfigStep from '@/components/setup/GameConfigStep';
import SavedGamesBanner from '@/components/game/SavedGamesBanner';
import GameBoard from '@/components/board/GameBoard';
import GameSidebar from '@/components/game/GameSidebar';
import { useGameSetup } from '@/hooks/useGameSetup';
import { useChessGame } from '@/hooks/useChessGame';
import { getGame } from '@/lib/api';
import { INITIAL_FEN } from '@/constants/chess';

export default function Home() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [difficultyName, setDifficultyName] = useState<string | null>(null);

  // Hook de configuración y persistencia de partidas
  const {
    selectedMode,
    selectedDifficultyId,
    selectedColor,
    profiles,
    isStartingGame,
    activeSavedGames,
    canStartGame,
    setSelectedMode,
    setSelectedDifficultyId,
    setSelectedColor,
    startNewGame,
    resetSetup,
  } = useGameSetup();

  const humanColor =
    selectedMode === 'PVP' ? null : selectedColor;

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
    gameId: activeGameId,
    gameMode: selectedMode,
    humanColor,
  });

  // ── Iniciar Nueva Partida ──────────────────────────────────────────────────
  const handleStartGame = async () => {
    try {
      const data = await startNewGame();
      setActiveGameId(data.gameId);
      loadPosition(data.fen, []);

      const orientation = selectedColor || 'white';
      setBoardOrientation(orientation);

      if (selectedMode === 'PV_STOCKFISH') {
        const prof = profiles.find((p) => p.id === selectedDifficultyId);
        setDifficultyName(prof ? prof.name : null);
      } else {
        setDifficultyName(null);
      }

      // Si el rival (Stockfish/IA) inició con blancas y el usuario eligió negras
      if (
        selectedColor === 'black' &&
        (selectedMode === 'PV_STOCKFISH' || selectedMode === 'PV_AI')
      ) {
        const gameData = await getGame(data.gameId);
        loadPosition(gameData.game.currentFen || data.fen, gameData.moves);
      }
    } catch (err) {
      alert(
        '❌ Ocurrió un error al crear la partida. ¿Están activos los servicios del backend y de IA?',
      );
      console.error(err);
    }
  };

  // ── Reanudar Partida Guardada ──────────────────────────────────────────────
  const handleResumeGame = async (gameId: string) => {
    try {
      const { game, moves } = await getGame(gameId);
      setActiveGameId(game.id);
      setSelectedMode(game.mode);

      loadPosition(
        game.currentFen || INITIAL_FEN,
        moves,
        game.result !== 'IN_PROGRESS',
        game.result,
      );

      if (game.mode === 'PVP' || game.whiteType === 'HUMAN') {
        setBoardOrientation('white');
        setSelectedColor('white');
      } else {
        setBoardOrientation('black');
        setSelectedColor('black');
      }

      if (game.difficultyProfile) {
        setDifficultyName(game.difficultyProfile.name);
      }
    } catch (err) {
      alert('❌ No se pudo cargar la partida seleccionada.');
      console.error(err);
    }
  };

  // ── Volver al Menú Principal ───────────────────────────────────────────────
  const handleReturnToMenu = () => {
    setActiveGameId(null);
    resetSetup();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0]">
      {/* Cabecera Institucional UNVIME */}
      <AjedritoHeader />

      {/* Contenido Principal */}
      <main
        className={`flex-1 min-h-0 flex justify-center max-w-7xl mx-auto w-full z-10 relative px-4 ${
          !activeGameId
            ? 'items-start pt-2 sm:pt-4 md:pt-6'
            : 'items-start pt-1 sm:pt-2 md:pt-4 pb-8'
        }`}
      >
        {!activeGameId ? (
          /* Estado 1: Configuración inicial de la partida */
          <div className="w-full max-w-[500px] md:max-w-[530px] flex flex-col gap-3">
            {!selectedMode ? (
              <ModeSelector onSelectMode={setSelectedMode} />
            ) : (
              <GameConfigStep
                selectedMode={selectedMode}
                selectedDifficultyId={selectedDifficultyId}
                selectedColor={selectedColor}
                profiles={profiles}
                isStartingGame={isStartingGame}
                canStartGame={canStartGame}
                onBack={() => setSelectedMode(null as any)}
                onSelectDifficulty={setSelectedDifficultyId}
                onSelectColor={setSelectedColor}
                onStartGame={handleStartGame}
              />
            )}

            {/* Banner para reanudar partidas pendientes */}
            <SavedGamesBanner
              savedGames={activeSavedGames}
              onResumeGame={handleResumeGame}
            />
          </div>
        ) : (
          /* Estado 2: Partida en vivo */
          <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-6 lg:gap-10 animate-in fade-in duration-300">
            <GameBoard
              fen={fen}
              boardOrientation={boardOrientation}
              isDraggable={isDraggable}
              onPieceDrop={onPieceDrop}
              onReturnToMenu={handleReturnToMenu}
            />

            <GameSidebar
              gameMode={selectedMode || 'PVP'}
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
        )}
      </main>

      {/* Modal de Coronación de Peón */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={handleSelectPromotion}
          onCancel={cancelPromotion}
        />
      )}

      {/* Modal de Fin de Partida con Confeti y Revancha */}
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        onNewGame={handleReturnToMenu}
        onRematch={handleStartGame}
        result={gameResult}
        gameMode={selectedMode || 'PVP'}
        humanSide={humanColor}
        moveCount={moveHistory.length}
        difficultyName={difficultyName}
        gameId={activeGameId || undefined}
        isLoadingRematch={isStartingGame}
      />

      {/* Pie Decorativo Institucional */}
      <DecorativeFooter />
    </div>
  );
}
