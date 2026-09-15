'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';
import { io, Socket } from 'socket.io-client';
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Handshake,
  AlertTriangle,
  Loader2,
  Brain,
  BrainCircuit,
  Bot,
  Users,
} from 'lucide-react';
import AjedritoHeader from '@/components/AjedritoHeader';
import DecorativeFooter from '@/components/DecorativeFooter';
import PromotionModal from '@/components/PromotionModal';
import GameResultModal from '@/components/GameResultModal';
import {
  createGame,
  getGame,
  makeMove,
  getDifficultyProfiles,
  BACKEND_URL,
  type GameMode,
  type DifficultyProfile,
  type MoveRecord,
  type GameStateResponse,
} from '@/lib/api';
import { getLocalGames, saveLocalGame, removeLocalGame } from '@/lib/gameStorage';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const RESULT_LABELS: Record<string, string> = {
  WHITE_WINS: '¡Ganan las Blancas!',
  BLACK_WINS: '¡Ganan las Negras!',
  DRAW: '¡Tablas!',
};

export default function Home() {
  // ── Estados de Configuración de Partida ────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | null>(null);
  const [profiles, setProfiles] = useState<DifficultyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    if (!selectedColor) {
      setSelectedColor('white');
    }
  };

  // ── Estado de Partidas en Curso para Reanudar ──────────────────────────────
  const [activeSavedGames, setActiveSavedGames] = useState<GameStateResponse[]>([]);

  // ── Estados del Tablero y Partida Activa ────────────────────────────────────
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('IN_PROGRESS');
  const [isCheck, setIsCheck] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [humanSide, setHumanSide] = useState<'white' | 'black' | null>(null);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [difficultyName, setDifficultyName] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Modal de promoción
  const [pendingPromotion, setPendingPromotion] = useState<{
    sourceSquare: string;
    targetSquare: string;
    color: 'white' | 'black';
  } | null>(null);

  // Scroll automático del historial
  const historyEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  // Cargar perfiles de dificultad de Stockfish
  useEffect(() => {
    setLoadingProfiles(true);
    getDifficultyProfiles('STOCKFISH')
      .then((data) => {
        setProfiles(data);
        if (data.length > 0 && !selectedDifficultyId) {
          // Preseleccionar Intermedio si existe, o el primero
          const intermedio = data.find((p) => p.name === 'Intermedio');
          setSelectedDifficultyId(intermedio ? intermedio.id : data[0].id);
        }
      })
      .catch((err) => console.error('Error cargando perfiles:', err))
      .finally(() => setLoadingProfiles(false));
  }, []);

  // Cargar partidas guardadas pendientes
  const loadSavedGames = useCallback(() => {
    const ids = getLocalGames();
    if (ids.length === 0) {
      setActiveSavedGames([]);
      return;
    }
    Promise.allSettled(ids.map((id) => getGame(id))).then((results) => {
      const valid = results
        .filter((r): r is PromiseFulfilledResult<GameStateResponse> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((g) => g.game.result === 'IN_PROGRESS');
      setActiveSavedGames(valid);
    });
  }, []);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  // ── Conexión Socket.io para la partida activa ──────────────────────────────
  useEffect(() => {
    if (!activeGameId) return;

    const socket: Socket = io(BACKEND_URL);
    socket.emit('join-game', activeGameId);

    socket.on(
      'opponent-move',
      (data: {
        move: MoveRecord;
        newFen: string;
        isGameOver: boolean;
        result: string;
        isCheck: boolean;
        turn: 'white' | 'black';
      }) => {
        chessRef.current.load(data.newFen);
        setFen(data.newFen);
        setIsCheck(data.isCheck);
        setMoveHistory((prev) => [...prev, data.move]);
        setIsOpponentThinking(false);

        if (data.isGameOver) {
          setIsGameOver(true);
          setGameResult(data.result);
          setShowResultModal(true);
        }
      },
    );

    socket.on('opponent-error', (err: { message: string }) => {
      setIsOpponentThinking(false);
      alert(`⚠️ ${err.message || 'Error del motor rival'}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeGameId]);

  // ── Iniciar Partida ────────────────────────────────────────────────────────
  const canStartGame =
    Boolean(selectedMode) &&
    Boolean(selectedColor) &&
    (selectedMode !== 'PV_STOCKFISH' || Boolean(selectedDifficultyId));

  const handleStartGame = async () => {
    if (!selectedMode || !selectedColor || !canStartGame) return;
    setIsStartingGame(true);

    try {
      const data = await createGame(
        selectedMode,
        selectedMode === 'PV_STOCKFISH' ? selectedDifficultyId || undefined : undefined,
        selectedColor,
      );

      saveLocalGame(data.gameId);
      setActiveGameId(data.gameId);

      chessRef.current.load(data.fen);
      setFen(data.fen);
      setMoveHistory([]);
      setIsGameOver(false);
      setGameResult('IN_PROGRESS');
      setIsCheck(false);
      setShowResultModal(false);

      if (selectedMode === 'PVP') {
        setHumanSide(null);
        setBoardOrientation(selectedColor);
      } else {
        setHumanSide(selectedColor);
        setBoardOrientation(selectedColor);
      }

      // Si Stockfish o IA inició con blancas y el usuario eligió negras
      if (selectedColor === 'black' && (selectedMode === 'PV_STOCKFISH' || selectedMode === 'PV_AI')) {
        // Cargar el historial del backend para traer la jugada 1 de la máquina
        const gameData = await getGame(data.gameId);
        setMoveHistory(gameData.moves);
      }

      if (selectedMode === 'PV_STOCKFISH') {
        const prof = profiles.find((p) => p.id === selectedDifficultyId);
        setDifficultyName(prof ? prof.name : null);
      }
    } catch (err) {
      alert('❌ Ocurrió un error al crear la partida. ¿Están activos los servicios del backend y de IA?');
      console.error(err);
    } finally {
      setIsStartingGame(false);
    }
  };

  // Reanudar una partida pendiente
  const handleResumeGame = async (gameId: string) => {
    try {
      const { game, moves } = await getGame(gameId);
      setActiveGameId(game.id);
      setSelectedMode(game.mode);

      chessRef.current.load(game.currentFen || INITIAL_FEN);
      setFen(game.currentFen || INITIAL_FEN);
      setMoveHistory(moves);
      setIsGameOver(game.result !== 'IN_PROGRESS');
      setGameResult(game.result);
      setIsCheck(chessRef.current.isCheck());

      if (game.mode === 'PVP') {
        setHumanSide(null);
        setBoardOrientation('white');
      } else if (game.whiteType === 'HUMAN') {
        setHumanSide('white');
        setBoardOrientation('white');
      } else {
        setHumanSide('black');
        setBoardOrientation('black');
      }

      if (game.difficultyProfile) {
        setDifficultyName(game.difficultyProfile.name);
      }
    } catch (err) {
      alert('❌ No se pudo cargar la partida seleccionada.');
      console.error(err);
    }
  };

  // Volver al menú de selección de partida
  const handleReturnToMenu = () => {
    setShowResultModal(false);
    setActiveGameId(null);
    setSelectedMode(null);
    setSelectedColor(null);
    loadSavedGames();
  };

  // ── Lógica de Movimientos en el Tablero ────────────────────────────────────
  const executeMove = useCallback(
    (sourceSquare: string, targetSquare: string, promotionPiece = 'q') => {
      if (!activeGameId) return false;
      const chess = chessRef.current;
      const prevFen = chess.fen();

      let localMove;
      try {
        localMove = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotionPiece,
        });
      } catch {
        return false;
      }
      if (!localMove) return false;

      setFen(chess.fen());
      setIsCheck(chess.isCheck());

      if (selectedMode === 'PV_STOCKFISH' || selectedMode === 'PV_AI') {
        setIsOpponentThinking(true);
      }

      makeMove(activeGameId, sourceSquare, targetSquare, promotionPiece)
        .then((data) => {
          chess.load(data.newFen);
          setFen(data.newFen);
          setIsCheck(data.isCheck);
          setMoveHistory((prev) => [...prev, data.move]);

          if (data.isGameOver) {
            setIsGameOver(true);
            setGameResult(data.result);
            setIsOpponentThinking(false);
            setShowResultModal(true);
          }
        })
        .catch(() => {
          chess.load(prevFen);
          setFen(prevFen);
          setIsCheck(false);
          setIsOpponentThinking(false);
        });

      return true;
    },
    [activeGameId, selectedMode],
  );

  const onPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (isGameOver || isOpponentThinking || !targetSquare) return false;

      const chess = chessRef.current;
      const pieceColor = piece.pieceType[0]; // 'w' o 'b'

      if (humanSide && (humanSide === 'white' ? 'w' : 'b') !== pieceColor) {
        return false;
      }

      if (chess.turn() !== pieceColor) return false;

      const tempChess = new Chess(chess.fen());
      const isPawnPromotion =
        (piece.pieceType === 'wP' && targetSquare.endsWith('8')) ||
        (piece.pieceType === 'bP' && targetSquare.endsWith('1'));

      try {
        const testMove = tempChess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPawnPromotion ? 'q' : undefined,
        });
        if (!testMove) return false;
      } catch {
        return false;
      }

      if (isPawnPromotion) {
        setPendingPromotion({
          sourceSquare,
          targetSquare,
          color: pieceColor === 'w' ? 'white' : 'black',
        });
        return false;
      }

      return executeMove(sourceSquare, targetSquare);
    },
    [isGameOver, isOpponentThinking, humanSide, executeMove],
  );

  const handleSelectPromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.sourceSquare, pendingPromotion.targetSquare, piece);
    setPendingPromotion(null);
  };

  const chess = chessRef.current;
  const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
  const isDraggable =
    !isGameOver &&
    !isOpponentThinking &&
    (humanSide === null || currentTurn === humanSide);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0]">
      {/* ── Cabecera Institucional ────────────────────────────────────────── */}
      <AjedritoHeader />

      {/* ── Contenido Principal ───────────────────────────────────────────── */}
      <main
        className={`flex-1 min-h-0 flex justify-center max-w-7xl mx-auto w-full z-10 relative px-4 ${
          !activeGameId
            ? 'items-start pt-2 sm:pt-4 md:pt-6'
            : 'items-start pt-1 sm:pt-2 md:pt-4 pb-8'
        }`}
      >
        {/* ===================================================================
            ESTADO 1: CONFIGURACIÓN INICIAL (El tablero NO se muestra)
            =================================================================== */}
        {!activeGameId ? (
          <div className="w-full max-w-[500px] md:max-w-[530px] flex flex-col gap-3">
            {!selectedMode ? (
              /* ── PASO 1: Elegí tu modalidad ── */
              <div className="w-full rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-7 md:p-8 shadow-sm flex flex-col gap-4 sm:gap-5 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C3026]">
                    Elegí tu modalidad
                  </h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Seleccioná cómo querés jugar
                  </p>
                </div>

                {/* Botones de Modalidad */}
                <div className="flex flex-col gap-3">
                  {/* 1. Jugador vs Jugador */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('PVP')}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#3B5B4C] hover:bg-[#F2F7F4] hover:shadow-xs transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#DDEAE1] flex items-center justify-center flex-shrink-0 text-[#233E31] shadow-2xs group-hover:scale-105 transition-transform">
                        <Users className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                          Jugador vs Jugador
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">En la misma PC</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#233E31] group-hover:translate-x-1 transition" />
                  </button>

                  {/* 2. Jugador vs Stockfish */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('PV_STOCKFISH')}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#1E4C6D] hover:bg-[#F0F7FA] hover:shadow-xs transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#E0EFF8] flex items-center justify-center flex-shrink-0 text-[#1E4C6D] shadow-2xs group-hover:scale-105 transition-transform">
                        <Bot className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                          Jugador vs Stockfish
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">Desafiá al motor de ajedrez</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#1E4C6D] group-hover:translate-x-1 transition" />
                  </button>

                  {/* 3. Jugar vs Ajedrito IA */}
                  <button
                    type="button"
                    onClick={() => handleSelectMode('PV_AI')}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#6B2F5C] hover:bg-[#FAF4F9] hover:shadow-xs transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFE4EE] flex items-center justify-center flex-shrink-0 text-[#6B2F5C] shadow-2xs group-hover:scale-105 transition-transform">
                        <BrainCircuit className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#1C3026] leading-snug">
                          Jugar vs Ajedrito IA
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">Una IA que aprende de tus partidas</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6B2F5C] group-hover:translate-x-1 transition" />
                  </button>
                </div>
              </div>
            ) : (
              /* ── PASO 2: Configuración de la modalidad seleccionada ("como pasar de hoja") ── */
              <div className="w-full rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-7 md:p-8 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-right-3 duration-200">
                {/* Barra superior con flechita para volver a las modalidades */}
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F3F5]">
                  <button
                    type="button"
                    onClick={() => setSelectedMode(null)}
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
                    <span className="text-xs font-bold text-[#2D3748]">
                      Seleccioná la dificultad
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#F4F5F2] border border-[#E2E8F0]">
                      {[
                        { name: 'Principiante', elo: '~ 800 ELO' },
                        { name: 'Intermedio', elo: '~ 1500 ELO' },
                        { name: 'Avanzado', elo: '~ 2200 ELO' },
                        { name: 'Experto', elo: '~ 3190 ELO' },
                      ].map((level) => {
                        const profileMatch = profiles.find((p) => p.name === level.name);
                        const isSelected = profileMatch
                          ? selectedDifficultyId === profileMatch.id
                          : false;

                        return (
                          <button
                            key={level.name}
                            type="button"
                            onClick={() => profileMatch && setSelectedDifficultyId(profileMatch.id)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#233E31] text-white shadow-xs font-semibold'
                                : 'text-[#4A5568] hover:bg-white hover:text-[#1C3026]'
                            }`}
                          >
                            <span className="text-xs leading-tight">{level.name}</span>
                            <span className={`text-[10px] mt-0.5 leading-none ${isSelected ? 'text-[#E2E8F0]' : 'text-[#718096]'}`}>
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
                      onClick={() => setSelectedColor('white')}
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
                      onClick={() => setSelectedColor('black')}
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
                  onClick={handleStartGame}
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
            )}

            {/* Sección Opcional: Reanudar partida guardada */}
            {activeSavedGames.length > 0 && (
              <div className="w-full rounded-2xl border border-[#E5E7EB] bg-white/90 px-4 py-2.5 shadow-2xs flex items-center justify-between text-xs animate-in fade-in">
                <span className="text-xs text-[#4A5568]">
                  Partida en curso guardada (<strong>{activeSavedGames[0].moves.length}</strong> jugadas)
                </span>
                <button
                  type="button"
                  onClick={() => handleResumeGame(activeSavedGames[0].game.id)}
                  className="font-bold text-[#233E31] hover:underline cursor-pointer flex items-center gap-1 text-xs"
                >
                  Reanudar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ===================================================================
              ESTADO 2: PARTIDA EN VIVO (Tablero visible con estética idéntica)
              =================================================================== */
          <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-6 lg:gap-10 animate-in fade-in duration-300">
            {/* Contenedor del Tablero de Ajedrez */}
            <div className="flex flex-col items-center gap-3">
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
                        borderRadius: '12px',
                      },
                      darkSquareStyle: { backgroundColor: '#879D8B' },
                      lightSquareStyle: { backgroundColor: '#DFE6DF' },
                    }}
                  />
                </div>
              </div>

              {/* Botón Volver al Menú */}
              <button
                type="button"
                onClick={handleReturnToMenu}
                className="px-5 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#233E31] text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar modalidad / Volver al menú
              </button>
            </div>

            {/* Panel Lateral de Partida */}
            <div className="w-full max-w-sm rounded-3xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-md flex flex-col gap-4 max-h-[min(520px,62vh)]">
              <div className="flex items-center justify-between pb-1 border-b border-[#F1F5F9]">
                <div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Partida en curso
                  </span>
                  <h3 className="font-serif-title text-lg font-bold text-[#1C3026] mt-0.5">
                    {selectedMode === 'PVP'
                      ? 'Jugador vs Jugador'
                      : selectedMode === 'PV_STOCKFISH'
                      ? `vs Stockfish · ${difficultyName || 'Intermedio'}`
                      : 'vs Ajedrito IA'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                  {selectedMode === 'PV_STOCKFISH' ? (
                    <Bot className="w-5 h-5 text-[#1E4C6D]" />
                  ) : selectedMode === 'PV_AI' ? (
                    <Brain className="w-5 h-5 text-[#6B2F5C]" />
                  ) : (
                    <Users className="w-5 h-5 text-[#233E31]" />
                  )}
                </div>
              </div>

              {/* Estado del turno */}
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
                    onClick={() => setShowResultModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#233E31]/10 hover:bg-[#233E31]/15 text-[#233E31] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#D9A74A]" />
                    Ver resultado detallado
                  </button>
                </div>
              ) : isOpponentThinking ? (
                <div className="p-3 rounded-xl bg-[#E0EFF8] border border-[#BAE6FD] text-[#0369A1] font-bold text-sm text-center animate-pulse flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {selectedMode === 'PV_AI' ? 'Ajedrito IA pensando…' : 'Stockfish calculando…'}
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
                  <span className={`w-3.5 h-3.5 rounded-full inline-block ${currentTurn === 'white' ? 'bg-white border border-[#CBD5E1] shadow-2xs' : 'bg-[#1E293B]'}`} />
                  {isCheck && '¡Jaque! · '}Turno de {currentTurn === 'white' ? 'Blancas' : 'Negras'}
                </div>
              )}

              {/* Historial de jugadas encapsulado contra desborde de scrollbar */}
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <span className="text-xs font-bold text-[#4A5568] uppercase tracking-wider">
                  Historial de jugadas
                </span>
                <div className="h-48 sm:h-56 w-full rounded-2xl border border-[#E2E8F0] bg-[#FAF9F5] shadow-inner overflow-hidden flex flex-col p-1">
                  <div className="flex-1 overflow-y-auto pr-1.5 pl-1.5 py-1 font-mono text-xs ajedrito-scroll">
                    {moveHistory.length === 0 ? (
                      <p className="text-[#94A3B8] text-center italic py-6 text-xs font-sans">
                        Aún no hay jugadas
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                          const white = moveHistory[i * 2];
                          const black = moveHistory[i * 2 + 1];
                          return (
                            <div
                              key={i + 1}
                              className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-white transition text-xs"
                            >
                              <span className="text-[#94A3B8] w-6">{i + 1}.</span>
                              <span className="text-[#1E293B] font-semibold flex-1">
                                {white?.san ?? ''}
                              </span>
                              <span className="text-[#64748B] flex-1">
                                {black?.san ?? ''}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={historyEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal de Promoción ────────────────────────────────────────────── */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={handleSelectPromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {/* ── Modal de Resultado de Partida (Victoria / Derrota / Tablas) ── */}
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        onNewGame={handleReturnToMenu}
        onRematch={handleStartGame}
        result={gameResult}
        gameMode={selectedMode || 'PVP'}
        humanSide={humanSide}
        moveCount={moveHistory.length}
        difficultyName={difficultyName}
        gameId={activeGameId || undefined}
        isLoadingRematch={isStartingGame}
      />

      {/* ── Pie de Página Decorativo Institucional ────────────────────────── */}
      <DecorativeFooter />
    </div>
  );
}
