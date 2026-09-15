"""
Constantes globales de dominio para el microservicio de IA de Ajedrito.
Centraliza rutas de artefactos, valuaciones de piezas y pesos heurísticos.
"""
from pathlib import Path
import chess

# Directorios y artefactos del modelo
AI_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = AI_ROOT_DIR / "models"
MODEL_FILENAME = "chess_model.joblib"
MODEL_FILE = MODELS_DIR / MODEL_FILENAME

# Valuación estándar de piezas para cálculo de balance de material
MATERIAL_PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
}

# Valuación de piezas para vectorización de características ML (69 features)
FEATURE_PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 100,
}

# Valuación posicional de piezas para puntuación de capturas heurísticas
HEURISTIC_PIECE_VALUES = {
    chess.PAWN: 10,
    chess.KNIGHT: 30,
    chess.BISHOP: 30,
    chess.ROOK: 50,
    chess.QUEEN: 90,
    chess.KING: 0,
}

# Bonificaciones tácticas y posicionales para el evaluador heurístico
CAPTURE_SCORE_MULTIPLIER = 10
EN_PASSANT_CAPTURE_SCORE = 10
CHECK_BONUS_SCORE = 15
CENTER_CONTROL_BONUS_SCORE = 5
CASTLING_BONUS_SCORE = 12
PROMOTION_BONUS_SCORE = 80

# Casillas centrales clave (d4, d5, e4, e5)
CENTER_SQUARES = {chess.D4, chess.D5, chess.E4, chess.E5}

# Niveles de dificultad adaptativa
ADAPTIVE_BENEVOLENT = "benevolent"
ADAPTIVE_STANDARD = "standard"
ADAPTIVE_CHALLENGING = "challenging"

# Modos de dificultad solicitables por la API
DIFFICULTY_ADAPTIVE = "adaptive"
DIFFICULTY_EASY = "easy"
DIFFICULTY_MEDIUM = "medium"
DIFFICULTY_HARD = "hard"
