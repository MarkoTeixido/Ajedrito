'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, type PieceDropHandlerArgs } from 'react-chessboard';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Handshake,
  AlertTriangle,
  Bot,
  BrainCircuit,
  Users,
} from 'lucide-react';
import AjedritoHeader from '@/components/AjedritoHeader';
import DecorativeFooter from '@/components/DecorativeFooter';
import PromotionModal from '@/components/PromotionModal';
import GameResultModal from '@/components/GameResultModal';
import {
  getGame,
  createGame,
  getDifficultyProfiles,
  makeMove,
  BACKEND_URL,
  type MoveRecord,
  type GameMode,
} from '@/lib/api';
import { saveLocalGame } from '@/lib/gameStorage';

const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const RESULT_LABELS: Record<string, string> = {
  WHITE_WINS: '¡Ganan las Blancas!',
  BLACK_WINS: '¡Ganan las Negras!',
  DRAW: '¡Tablas!',
};

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const router = useRouter();

  // chess.js instance
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('IN_PROGRESS');
  const [isCheck, setIsCheck] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [humanColor, setHumanColor] = useState<'white' | 'black' | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Modal de promoción
  const [pendingPromotion, setPendingPromotion] = useState<{
    sourceSquare: string;
    targetSquare: string;
    color: 'white' | 'black';
  } | null>(null);

  // Modo de juego y dificultad
  const [gameMode, setGameMode] = useState<GameMode>('PVP');
  const [difficultyName, setDifficultyName] = useState<string | null>(null);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [isStartingRematch, setIsStartingRematch] = useState(false);

  // Historial de jugadas scrollable
  const historyEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  // Cargar estado inicial de la partida
  useEffect(() => {
    getGame(gameId)
      .then(({ game, moves }) => {
        saveLocalGame(gameId);

        const initialFen = game.currentFen || INITIAL_FEN;
        chessRef.current.load(initialFen);
        setFen(initialFen);
        setMoveHistory(moves);
        setIsGameOver(game.result !== 'IN_PROGRESS');
        setGameResult(game.result);
        setGameMode(game.mode);

        if (game.mode === 'PVP') {
          setHumanColor(null);
        } else if (game.whiteType === 'HUMAN') {
          setHumanColor('white');
          setBoardOrientation('white');
        } else {
          setHumanColor('black');
          setBoardOrientation('black');
        }

        if (game.difficultyProfile) {
          setDifficultyName(game.difficultyProfile.name);
        }

        setIsCheck(chessRef.current.inCheck());
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Error al cargar la partida');
      })
      .finally(() => setLoading(false));
  }, [gameId]);


  // Socket.io para movimientos del rival
  useEffect(() => {
    if (gameMode === 'PVP') return;

    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket'],
    });

    socket.emit('game:join', { gameId });

    socket.on('game:opponent_thinking', () => {
      setIsOpponentThinking(true);
    });

    socket.on(
      'game:opponent_moved',
      ({
        move,
        fen: newFen,
        result,
      }: {
        move: MoveRecord;
        fen: string;
        result?: string;
      }) => {
        setIsOpponentThinking(false);
        chessRef.current.load(newFen);
        setFen(newFen);
        setMoveHistory((prev) => [...prev, move]);
        setIsCheck(chessRef.current.inCheck());

        if (result && result !== 'IN_PROGRESS') {
          setIsGameOver(true);
          setGameResult(result);
          setShowResultModal(true);
        }
      },
    );

    socket.on('game:error', ({ error }: { error: string }) => {
      setIsOpponentThinking(false);
      alert(`⚠️ Error en la partida: ${error}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId, gameMode]);

  // Ejecución de jugada vía backend
  const executeMove = useCallback(
    async (sourceSquare: string, targetSquare: string, promotionPiece = 'q') => {
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

      // Actualización optimista inmediata
      setFen(chess.fen());
      setIsCheck(chess.inCheck());

      if (gameMode === 'PV_STOCKFISH' || gameMode === 'PV_AI') {
        setIsOpponentThinking(true);
      }

      try {
        const data = await makeMove(gameId, sourceSquare, targetSquare, promotionPiece);
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
        return true;
      } catch (err) {
        // Revertir en caso de fallo
        chess.load(prevFen);
        setFen(prevFen);
        setIsCheck(chess.inCheck());
        setIsOpponentThinking(false);
        console.error('Error al persistir movimiento:', err);
        return false;
      }
    },
    [gameId, gameMode],
  );

  // Manejador de drag & drop
  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
    piece,
  }: PieceDropHandlerArgs): boolean => {
    if (isGameOver || isOpponentThinking || !targetSquare) return false;

    const chess = chessRef.current;
    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';

    if (humanColor !== null && currentTurn !== humanColor) {
      return false;
    }

    const isPawn = piece.pieceType.toLowerCase() === 'p';
    const isPromotionRank =
      (currentTurn === 'white' && targetSquare.endsWith('8')) ||
      (currentTurn === 'black' && targetSquare.endsWith('1'));

    if (isPawn && isPromotionRank) {
      const legalMoves = chess.moves({ square: sourceSquare as any, verbose: true });
      const isLegalPromotion = legalMoves.some(
        (m) => m.to === targetSquare && m.promotion,
      );
      if (isLegalPromotion) {
        setPendingPromotion({
          sourceSquare,
          targetSquare,
          color: currentTurn,
        });
        return false;
      }
    }

    executeMove(sourceSquare, targetSquare);
    return true;
  };

  const handleSelectPromotion = (pieceType: string) => {
    if (!pendingPromotion) return;
    const { sourceSquare, targetSquare } = pendingPromotion;
    setPendingPromotion(null);
    executeMove(sourceSquare, targetSquare, pieceType);
  };

  const handleRematch = async () => {
    try {
      setIsStartingRematch(true);
      let diffId: string | undefined = undefined;
      if (gameMode === 'PV_STOCKFISH') {
        const profs = await getDifficultyProfiles('STOCKFISH');
        const found = profs.find((p) => p.name === difficultyName);
        diffId = found ? found.id : profs[0]?.id;
      }
      const data = await createGame(gameMode, diffId, humanColor || 'white');
      saveLocalGame(data.gameId);
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      console.error('Error iniciando revancha:', err);
      router.push('/');
    } finally {
      setIsStartingRematch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F6F5F0] text-[#233E31]">
        <AjedritoHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#233E31]/30 border-t-[#233E31] rounded-full animate-spin" />
          <p className="font-serif text-lg font-bold">Cargando partida...</p>
        </main>
        <DecorativeFooter />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F6F5F0] text-[#233E31]">
        <AjedritoHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl max-w-md text-center">
            <p className="font-semibold mb-2">Error al cargar la partida</p>
            <p className="text-sm">{loadError}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl bg-[#233E31] text-[#F6F5F0] font-semibold hover:bg-[#1a2f25] transition"
          >
            ← Volver al menú
          </button>
        </main>
        <DecorativeFooter />
      </div>
    );
  }

  const chess = chessRef.current;
  const turn = chess.turn() === 'w' ? 'white' : 'black';
  const turnLabel = turn === 'white' ? 'Blancas' : 'Negras';
  const isDraggable =
    !isGameOver &&
    !isOpponentThinking &&
    (humanColor === null || turn === humanColor);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F6F5F0] text-[#233E31]">
      <AjedritoHeader />

      <main className="flex-1 min-h-0 flex flex-col items-center justify-start pt-2 sm:pt-4 p-2 sm:p-3 max-w-6xl w-full mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center w-full">
          {/* Columna Izquierda: Tablero y Controles */}
          <div className="flex flex-col items-center gap-2 max-h-full">
            {/* Barra de Estado */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#EAE8DF] px-3.5 py-1.5 rounded-xl border border-[#233E31]/15 w-full shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center">
                  {gameMode === 'PV_STOCKFISH' ? (
                    <Bot className="w-4 h-4 text-[#1E4C6D]" />
                  ) : gameMode === 'PV_AI' ? (
                    <BrainCircuit className="w-4 h-4 text-[#6B2F5C]" />
                  ) : (
                    <Users className="w-4 h-4 text-[#233E31]" />
                  )}
                </span>
                <span className="font-serif font-bold text-xs text-[#233E31]">
                  {gameMode === 'PV_STOCKFISH'
                    ? `Stockfish (${difficultyName || 'Nivel estándar'})`
                    : gameMode === 'PV_AI'
                    ? 'Ajedrito IA'
                    : 'PVP Hotseat'}
                </span>
              </div>

              {isGameOver ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D9A74A]/20 border border-[#D9A74A] text-[#82294F] font-bold text-[11px] flex items-center gap-1.5">
                    {gameResult === 'DRAW' ? (
                      <Handshake className="w-3.5 h-3.5 text-[#82294F]" />
                    ) : (
                      <Trophy className="w-3.5 h-3.5 text-[#82294F]" />
                    )}
                    {RESULT_LABELS[gameResult] ?? 'Partida terminada'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowResultModal(true)}
                    className="px-2 py-0.5 rounded-full bg-[#233E31]/10 hover:bg-[#233E31]/15 text-[#233E31] font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trophy className="w-3 h-3 text-[#D9A74A]" />
                    Ver resultado
                  </button>
                </div>
              ) : isOpponentThinking ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#689799]/20 border border-[#689799] text-[#233E31] font-semibold text-[11px] animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#689799] animate-ping" />
                  Calculando…
                </span>
              ) : (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                    isCheck
                      ? 'bg-red-100 border-red-400 text-red-800 animate-pulse'
                      : 'bg-white/80 border-[#233E31]/20 text-[#233E31]'
                  }`}
                >
                  {isCheck && (
                    <span className="flex items-center gap-1 text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Jaque ·
                    </span>
                  )}
                  <span>Turno: {turnLabel}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full border inline-block ${
                      turn === 'white' ? 'bg-white border-[#CBD5E1]' : 'bg-[#1E293B] border-black'
                    }`}
                  />
                </span>
              )}
            </div>

            {/* Tablero de Ajedrez */}
            <div className="w-[min(440px,50vh)] aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-[#233E31]/20 bg-[#233E31]/10 p-1.5">
              <div className="w-full h-full rounded-xl overflow-hidden shadow-inner">
                <Chessboard
                  options={{
                    position: fen,
                    onPieceDrop,
                    boardOrientation,
                    allowDragging: isDraggable,
                    boardStyle: {
                      borderRadius: '8px',
                    },
                    darkSquareStyle: { backgroundColor: '#879D8B' },
                    lightSquareStyle: { backgroundColor: '#DFE6DF' },
                  }}
                />
              </div>
            </div>

            {/* Acciones de Tablero */}
            <div className="flex items-center justify-between w-full gap-2 px-1">
              <button
                onClick={() => setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))}
                className="px-3 py-1 rounded-lg bg-[#EAE8DF] hover:bg-[#DFDCCF] border border-[#233E31]/15 text-[11px] font-semibold text-[#233E31] transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Girar tablero
              </button>

              <button
                onClick={() => router.push('/')}
                className="px-3 py-1 rounded-lg bg-[#233E31] hover:bg-[#1a2f25] text-[11px] font-semibold text-[#F6F5F0] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al menú
              </button>
            </div>
          </div>

          {/* Columna Derecha: Panel de Historial de Jugadas */}
          <div className="w-full lg:w-64 flex flex-col gap-2 max-h-[min(480px,56vh)]">
            <div className="bg-[#EAE8DF] p-3.5 rounded-2xl border border-[#233E31]/15 shadow-2xs flex flex-col h-full overflow-hidden">
              <h3 className="font-serif font-bold text-xs text-[#233E31] mb-2 pb-1.5 border-b border-[#233E31]/15 flex items-center justify-between">
                <span>Historial</span>
                <span className="text-[10px] font-sans font-normal text-[#233E31]/70">
                  {moveHistory.length} jugadas
                </span>
              </h3>

              <div className="h-40 sm:h-48 overflow-y-auto pr-1.5 pl-0.5 space-y-0.5 font-mono text-xs flex-1 ajedrito-scroll">
                {moveHistory.length === 0 ? (
                  <p className="text-[#233E31]/50 text-xs italic text-center py-8 font-sans">
                    Aún no se realizaron jugadas.
                  </p>
                ) : (
                  Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                    const white = moveHistory[i * 2];
                    const black = moveHistory[i * 2 + 1];
                    const moveNum = i + 1;
                    return (
                      <div
                        key={moveNum}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white transition text-[#233E31]"
                      >
                        <span className="text-[#233E31]/40 w-6">{moveNum}.</span>
                        <span className="font-bold flex-1">{white?.san ?? ''}</span>
                        <span className="text-[#233E31]/80 flex-1">{black?.san ?? ''}</span>
                      </div>
                    );
                  })
                )}
                <div ref={historyEndRef} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Promoción */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={handleSelectPromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {/* Modal de Resultado de Partida (Victoria / Derrota / Tablas) */}
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        onNewGame={() => router.push('/')}
        onRematch={handleRematch}
        isLoadingRematch={isStartingRematch}
        result={gameResult}
        gameMode={gameMode}
        humanSide={humanColor}
        moveCount={moveHistory.length}
        difficultyName={difficultyName}
        gameId={gameId}
      />

      <DecorativeFooter />
    </div>
  );
}
