"""
Evaluador heurístico táctico y posicional para Ajedrito.
Responsabilidad única (SRP): puntuar y seleccionar jugadas legales según
criterios de ajedrez (capturas, jaques, control central, enroques y promociones).
"""
from typing import List, Tuple
import chess

from src.core.constants import (
    MATERIAL_PIECE_VALUES,
    HEURISTIC_PIECE_VALUES,
    CAPTURE_SCORE_MULTIPLIER,
    EN_PASSANT_CAPTURE_SCORE,
    CHECK_BONUS_SCORE,
    CENTER_CONTROL_BONUS_SCORE,
    CASTLING_BONUS_SCORE,
    PROMOTION_BONUS_SCORE,
    CENTER_SQUARES,
    ADAPTIVE_BENEVOLENT,
    ADAPTIVE_STANDARD,
)


class HeuristicEvaluator:
    """
    Evalúa posiciones y jugadas legales de ajedrez mediante reglas heurísticas
    determinísticas sin requerir un modelo de Machine Learning.
    """

    @staticmethod
    def calculate_material_balance(board: chess.Board) -> int:
        """
        Calcula la diferencia de material desde la perspectiva del turno activo.
        Positivo: ventaja del turno activo. Negativo: desventaja.
        """
        turn_color = board.turn
        opp_color = not turn_color

        my_score = sum(len(board.pieces(pt, turn_color)) * val for pt, val in MATERIAL_PIECE_VALUES.items())
        opp_score = sum(len(board.pieces(pt, opp_color)) * val for pt, val in MATERIAL_PIECE_VALUES.items())
        return my_score - opp_score

    @classmethod
    def score_legal_moves(cls, board: chess.Board) -> List[Tuple[int, chess.Move]]:
        """
        Puntúa todas las jugadas legales con criterios posicionales y tácticos:
        capturas, jaques, control central, enroque y promoción.
        Retorna lista de tuplas (score, move) ordenada descendentemente por score.
        """
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            raise ValueError("No hay jugadas legales en la posición dada.")

        scored_moves = []
        for move in legal_moves:
            score = 0

            # 1. Si captura una pieza rival
            if board.is_capture(move):
                captured_piece = board.piece_at(move.to_square)
                if captured_piece:
                    score += HEURISTIC_PIECE_VALUES.get(captured_piece.piece_type, 10) * CAPTURE_SCORE_MULTIPLIER
                else:
                    score += EN_PASSANT_CAPTURE_SCORE  # En passant

            # 2. Si da jaque
            if board.gives_check(move):
                score += CHECK_BONUS_SCORE

            # 3. Control de casillas centrales (d4, d5, e4, e5)
            if move.to_square in CENTER_SQUARES:
                score += CENTER_CONTROL_BONUS_SCORE

            # 4. Enroque
            if board.is_castling(move):
                score += CASTLING_BONUS_SCORE

            # 5. Promoción de peón
            if move.promotion:
                score += PROMOTION_BONUS_SCORE

            scored_moves.append((score, move))

        # Ordenar de mayor a menor puntaje
        scored_moves.sort(key=lambda x: x[0], reverse=True)
        return scored_moves

    @classmethod
    def select_best_move(cls, board: chess.Board, adaptive_level: str = ADAPTIVE_STANDARD) -> chess.Move:
        """
        Selecciona una jugada legal según la política adaptativa:
        - 'challenging': la mejor jugada táctica de máxima puntuación.
        - 'benevolent': selecciona una jugada sólida de desarrollo en lugar de la captura más destructiva.
        - 'standard': la mejor jugada legal disponible.
        """
        scored = cls.score_legal_moves(board)
        if not scored:
            raise ValueError("No hay jugadas legales.")

        if adaptive_level == ADAPTIVE_BENEVOLENT and len(scored) > 1:
            for _score, move in scored[1:]:
                if not board.is_capture(move):
                    return move
            return scored[1][1]

        return scored[0][1]


# Funciones de conveniencia directas
calculate_material_balance = HeuristicEvaluator.calculate_material_balance
score_legal_moves = HeuristicEvaluator.score_legal_moves
select_best_heuristic_move = HeuristicEvaluator.select_best_move
