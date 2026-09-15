"""
Predictor de jugadas para Ajedrito AI Service.
Orquesta la inferencia del modelo propio scikit-learn, el filtrado estricto
de jugadas legales de la FIDE, la política de dificultad y el fallback heurístico.
"""
from typing import Dict, Any, Optional
import numpy as np
import chess

from src.core.constants import (
    MODEL_FILE,
    MODELS_DIR,
    ADAPTIVE_BENEVOLENT,
    ADAPTIVE_STANDARD,
    DIFFICULTY_ADAPTIVE,
)
from src.core.logging import get_logger
from src.ml.feature_extractor import extract_features_from_board
from src.ml.model_registry import ModelRegistry, load_model
from src.ml.heuristics import (
    HeuristicEvaluator,
    calculate_material_balance,
    select_best_heuristic_move,
)
from src.ml.difficulty import DifficultyPolicy, resolve_adaptive_level

logger = get_logger(__name__)

# Compatibilidad con imports directos existentes
_calculate_material_balance = calculate_material_balance
_heuristic_best_move = select_best_heuristic_move


def _heuristic_moves(board: chess.Board):
    """Función de compatibilidad con tests o consumidores internos."""
    return HeuristicEvaluator.score_legal_moves(board)


def _predict_with_model(
    model: Any,
    board: chess.Board,
    legal_uci_set: Dict[str, chess.Move],
    adaptive_level: str,
) -> tuple[Optional[chess.Move], Optional[float]]:
    """
    Ejecuta la inferencia sobre el modelo scikit-learn y selecciona
    la mejor opción legal considerando el nivel adaptativo.
    """
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
                # En modo benevolente, modera la agresividad eligiendo la 2da opción si existe
                if adaptive_level == ADAPTIVE_BENEVOLENT and len(legal_candidates) > 1:
                    return legal_candidates[1]
                return legal_candidates[0]
        else:
            pred_uci = model.predict(features)[0]
            if pred_uci in legal_uci_set:
                return legal_uci_set[pred_uci], 1.0
    except Exception as err:
        logger.warning(f"Error durante inferencia ML: {err}")

    return None, None


def predict_move(fen: str, difficulty: str = DIFFICULTY_ADAPTIVE) -> Dict[str, Any]:
    """
    Predice la próxima jugada para una posición dada en FEN aplicando la política adaptativa.
    Garantiza que la jugada seleccionada sea 100% legal según las reglas de la FIDE.
    """
    try:
        board = chess.Board(fen)
    except Exception as e:
        raise ValueError(f"Formato FEN invalido: {e}")

    if board.is_game_over():
        raise ValueError("La posición dada ya corresponde a una partida terminada.")

    legal_moves = list(board.legal_moves)
    if not legal_moves:
        raise ValueError("No hay jugadas legales en la posición dada.")

    legal_uci_set = {m.uci(): m for m in legal_moves}

    # 1. Evaluar balance de material y política adaptativa
    mat_balance = calculate_material_balance(board)
    adaptive_level = resolve_adaptive_level(difficulty, mat_balance)

    # 2. Intentar inferencia con modelo entrenado
    model = ModelRegistry.load_model()
    selected_move: Optional[chess.Move] = None
    confidence: Optional[float] = None
    method = "heuristic"

    if model is not None:
        selected_move, confidence = _predict_with_model(model, board, legal_uci_set, adaptive_level)
        if selected_move is not None:
            method = "ml"

    # 3. Fallback seguro heurístico si el modelo no está disponible o no predijo jugada legal
    if selected_move is None:
        selected_move = select_best_heuristic_move(board, adaptive_level=adaptive_level)
        confidence = 0.5
        method = "heuristic"

    # 4. Formatear la respuesta
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
