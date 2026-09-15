"""
Predictor de jugadas para el ai-service.
Carga el modelo scikit-learn entrenado y evalúa la posición actual (FEN).
Filtra estrictamente contra las jugadas legales para garantizar
que NUNCA se produzca una jugada ilegal.
"""
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import chess

from src.ml.feature_extractor import extract_features_from_board

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_FILE = MODELS_DIR / "chess_model.joblib"

_cached_model = None


def load_model():
    """Carga o retorna en memoria el modelo entrenado."""
    global _cached_model
    if _cached_model is None and MODEL_FILE.exists():
        try:
            _cached_model = joblib.load(MODEL_FILE)
        except Exception as e:
            print(f"[Predictor] Error cargando modelo {MODEL_FILE}: {e}")
            _cached_model = None
    return _cached_model


def _calculate_material_balance(board: chess.Board) -> int:
    """
    Calcula la diferencia de material desde la perspectiva del turno activo.
    Positivo: ventaja del turno activo. Negativo: desventaja.
    """
    values = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}
    turn_color = board.turn
    opp_color = not turn_color

    my_score = sum(len(board.pieces(pt, turn_color)) * val for pt, val in values.items())
    opp_score = sum(len(board.pieces(pt, opp_color)) * val for pt, val in values.items())
    return my_score - opp_score


def _heuristic_moves(board: chess.Board) -> list:
    """
    Puntúa todas las jugadas legales con criterios posicionales y tácticos:
    capturas, jaques, control central, enroque y desarrollo.
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        raise ValueError("No hay jugadas legales en la posición dada.")

    piece_values = {
        chess.PAWN: 10,
        chess.KNIGHT: 30,
        chess.BISHOP: 30,
        chess.ROOK: 50,
        chess.QUEEN: 90,
        chess.KING: 0,
    }

    scored_moves = []
    for move in legal_moves:
        score = 0
        # 1. Si captura una pieza rival
        if board.is_capture(move):
            captured_piece = board.piece_at(move.to_square)
            if captured_piece:
                score += piece_values.get(captured_piece.piece_type, 10) * 10
            else:
                score += 10  # En passant

        # 2. Si da jaque
        if board.gives_check(move):
            score += 15

        # 3. Control de casillas centrales (d4, d5, e4, e5)
        if move.to_square in [chess.D4, chess.D5, chess.E4, chess.E5]:
            score += 5

        # 4. Enroque
        if board.is_castling(move):
            score += 12

        # 5. Promoción de peón
        if move.promotion:
            score += 80

        scored_moves.append((score, move))

    # Ordenar de mayor a menor puntaje
    scored_moves.sort(key=lambda x: x[0], reverse=True)
    return scored_moves


def _heuristic_best_move(board: chess.Board, adaptive_level: str = "standard") -> chess.Move:
    """
    Selecciona una jugada legal según la política adaptativa:
    - 'challenging': la mejor jugada táctica de máxima puntuación.
    - 'benevolent': si el jugador está perdiendo fuertemente, selecciona una jugada sólida de desarrollo
      en lugar de la combinación más destructiva, manteniendo la partida competitiva.
    - 'standard': la mejor jugada legal disponible.
    """
    scored = _heuristic_moves(board)
    if not scored:
        raise ValueError("No hay jugadas legales.")

    if adaptive_level == "benevolent" and len(scored) > 1:
        # Elegir una jugada sólida pero no la más agresiva si la mejor es una captura aplastante
        for score, move in scored[1:]:
            if not board.is_capture(move):
                return move
        return scored[1][1]

    return scored[0][1]


def predict_move(fen: str, difficulty: str = "adaptive") -> Dict[str, Any]:
    """
    Predice la próxima jugada para una posición dada en FEN aplicando la política adaptativa.
    Garantiza que la jugada seleccionada sea 100% legal según las reglas de la FIDE.
    """
    board = chess.Board(fen)

    if board.is_game_over():
        raise ValueError("La posición dada ya corresponde a una partida terminada.")

    legal_moves = list(board.legal_moves)
    legal_uci_set = {m.uci(): m for m in legal_moves}

    # Evaluar balance de material en la posición
    mat_balance = _calculate_material_balance(board)
    if difficulty == "adaptive":
        if mat_balance >= 4:
            adaptive_level = "benevolent"
        elif mat_balance <= -2:
            adaptive_level = "challenging"
        else:
            adaptive_level = "standard"
    elif difficulty == "easy":
        adaptive_level = "benevolent"
    elif difficulty == "hard":
        adaptive_level = "challenging"
    else:
        adaptive_level = "standard"

    model = load_model()
    selected_move: Optional[chess.Move] = None
    confidence: Optional[float] = None
    method = "heuristic"

    if model is not None:
        try:
            features = extract_features_from_board(board).reshape(1, -1)
            classes = model.classes_

            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(features)[0]
                sorted_indices = np.argsort(probs)[::-1]

                legal_candidates = []
                for idx in sorted_indices:
                    candidate_uci = classes[idx]
                    if candidate_uci in legal_uci_set:
                        legal_candidates.append((legal_uci_set[candidate_uci], float(probs[idx])))

                if legal_candidates:
                    # En modo benevolente, si hay varias opciones, elige una alternativa válida para moderar
                    if adaptive_level == "benevolent" and len(legal_candidates) > 1:
                        selected_move, confidence = legal_candidates[1]
                    else:
                        selected_move, confidence = legal_candidates[0]
                    method = "ml"
            else:
                pred_uci = model.predict(features)[0]
                if pred_uci in legal_uci_set:
                    selected_move = legal_uci_set[pred_uci]
                    confidence = 1.0
                    method = "ml"
        except Exception as e:
            print(f"[Predictor] Error durante inferencia ML: {e}")

    # Fallback seguro: si el modelo no acertó una jugada legal o no está cargado
    if selected_move is None:
        selected_move = _heuristic_best_move(board, adaptive_level=adaptive_level)
        confidence = 0.5
        method = "heuristic"

    san_move = board.san(selected_move)
    uci_str = selected_move.uci()

    from_square = uci_str[:2]
    to_square = uci_str[2:4]
    promotion = uci_str[4] if len(uci_str) > 4 else None

    return {
        "san": san_move,
        "uci": uci_str,
        "from": from_square,
        "to": to_square,
        "promotion": promotion,
        "confidence": round(confidence, 4) if confidence is not None else 0.5,
        "method": method,
        "adaptive_level": adaptive_level,
    }
