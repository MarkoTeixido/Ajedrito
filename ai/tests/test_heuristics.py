"""
Pruebas unitarias para el evaluador heurístico de Ajedrito (src/ml/heuristics.py).
"""
import pytest
import chess

from src.ml.heuristics import (
    HeuristicEvaluator,
    calculate_material_balance,
    select_best_heuristic_move,
)
from src.core.constants import (
    ADAPTIVE_BENEVOLENT,
    ADAPTIVE_STANDARD,
    ADAPTIVE_CHALLENGING,
)


def test_material_balance_starting_position():
    board = chess.Board()
    # En la posición inicial el balance debe ser 0
    balance = calculate_material_balance(board)
    assert balance == 0


def test_material_balance_white_advantage():
    # Posición donde las blancas tienen una dama de ventaja
    fen_white_up_queen = "rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    board = chess.Board(fen_white_up_queen)
    balance = calculate_material_balance(board)
    # Negras no tienen dama (falta 'q'), blancas tienen todas: balance = +9
    assert balance == 9


def test_material_balance_from_black_perspective():
    # Posición donde es turno de las negras y tienen un caballo de desventaja
    # Blancas tienen caballo en f3, negras no tienen caballo en b8
    fen = "r1bqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1"
    board = chess.Board(fen)
    balance = calculate_material_balance(board)
    # Desde la perspectiva de las negras (turno activo): tienen -3
    assert balance == -3


def test_score_legal_moves_prioritizes_valuable_capture():
    # Blancas pueden capturar la dama rival en d5 con peón en e4 o alfil en c4
    fen = "rnb1kbnr/ppp1pppp/8/3q4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
    board = chess.Board(fen)

    scored_moves = HeuristicEvaluator.score_legal_moves(board)
    assert len(scored_moves) > 0

    best_score, best_move = scored_moves[0]
    # La mejor jugada debe ser capturar la dama (e4xd5)
    captured_piece = board.piece_at(best_move.to_square)
    assert captured_piece is not None
    assert captured_piece.piece_type == chess.QUEEN
    assert best_score >= 900  # 90 * 10 de captura


def test_select_best_move_returns_legal():
    board = chess.Board()
    move = select_best_heuristic_move(board, adaptive_level=ADAPTIVE_STANDARD)
    assert move in board.legal_moves


def test_select_best_move_benevolent_moderation():
    # Posición con captura clara pero en modo benevolente evalúa alternativas
    fen = "rnb1kbnr/ppp1pppp/8/3q4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
    board = chess.Board(fen)
    move_benevolent = select_best_heuristic_move(board, adaptive_level=ADAPTIVE_BENEVOLENT)
    assert move_benevolent in board.legal_moves


def test_score_legal_moves_raises_on_empty():
    board = chess.Board()
    board.clear()  # Tablero vacío sin jugadas posibles
    with pytest.raises(ValueError, match="No hay jugadas legales"):
        HeuristicEvaluator.score_legal_moves(board)
