'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { type PieceDropHandlerArgs } from 'react-chessboard';
import { io, Socket } from 'socket.io-client';
import { makeMove, BACKEND_URL, type MoveRecord, type GameMode } from '@/lib/api';
import { INITIAL_FEN } from '@/constants/chess';

export interface UseChessGameOptions {
  gameId: string | null;
  gameMode: GameMode | null;
  humanColor: 'white' | 'black' | null;
  onGameFinished?: (result: string) => void;
}

export interface PendingPromotion {
  sourceSquare: string;
  targetSquare: string;
  color: 'white' | 'black';
}

export function useChessGame({
  gameId,
  gameMode,
  humanColor,
  onGameFinished,
}: UseChessGameOptions) {
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('IN_PROGRESS');
  const [isCheck, setIsCheck] = useState(false);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  /**
   * Inicializa o restaura el estado del tablero con una posición dada.
   */
  const loadPosition = useCallback(
    (newFen: string, moves: MoveRecord[] = [], gameOver = false, result = 'IN_PROGRESS') => {
      try {
        chessRef.current.load(newFen);
      } catch {
        chessRef.current.load(INITIAL_FEN);
      }
      setFen(chessRef.current.fen());
      setMoveHistory(moves);
      setIsGameOver(gameOver);
      setGameResult(result);
      setIsCheck(chessRef.current.isCheck());
      setIsOpponentThinking(false);
      setShowResultModal(false);
      setPendingPromotion(null);
    },
    [],
  );

  /**
   * Ejecuta un movimiento en el tablero local de forma optimista y lo envía al backend.
   * Si la llamada al backend falla, realiza un rollback al FEN previo.
   */
  const executeMove = useCallback(
    (sourceSquare: string, targetSquare: string, promotionPiece = 'q'): boolean => {
      if (!gameId) return false;
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

      if (gameMode === 'PV_STOCKFISH' || gameMode === 'PV_AI') {
        setIsOpponentThinking(true);
      }

      makeMove(gameId, sourceSquare, targetSquare, promotionPiece)
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
            onGameFinished?.(data.result);
          }
        })
        .catch(() => {
          chess.load(prevFen);
          setFen(prevFen);
          setIsCheck(chess.isCheck());
          setIsOpponentThinking(false);
        });

      return true;
    },
    [gameId, gameMode, onGameFinished],
  );

  /**
   * Manejador del drop de piezas en react-chessboard.
   * Valida turno, color humano y detecta coronación de peón.
   */
  const onPieceDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (isGameOver || isOpponentThinking || !targetSquare) return false;

      const chess = chessRef.current;
      const pieceColor = piece.pieceType[0]; // 'w' o 'b'

      if (humanColor && (humanColor === 'white' ? 'w' : 'b') !== pieceColor) {
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
    [isGameOver, isOpponentThinking, humanColor, executeMove],
  );

  /**
   * Completa la coronación de peón con la pieza seleccionada en el modal.
   */
  const handleSelectPromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.sourceSquare, pendingPromotion.targetSquare, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, executeMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  // ── Sincronización WebSocket con Socket.io ─────────────────────────────────
  useEffect(() => {
    if (!gameId) return;

    const socket: Socket = io(BACKEND_URL);
    socket.emit('join-game', gameId);

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
          onGameFinished?.(data.result);
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
  }, [gameId, onGameFinished]);

  const currentTurn: 'white' | 'black' =
    chessRef.current.turn() === 'w' ? 'white' : 'black';

  const isDraggable =
    !isGameOver &&
    !isOpponentThinking &&
    (humanColor === null || currentTurn === humanColor);

  return {
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
    executeMove,
    onPieceDrop,
    handleSelectPromotion,
    cancelPromotion,
  };
}
