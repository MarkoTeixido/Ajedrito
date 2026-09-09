"""
Extractor de características numéricas a partir de cadenas FEN.
Convierte cualquier posición de ajedrez en un vector numérico adecuado
para algoritmos de Machine Learning (scikit-learn).
"""
import numpy as np
import chess

# Mapeo numérico estándar de piezas de ajedrez
# Positivo para blancas, negativo para negras
PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 100,
}


def extract_features_from_board(board: chess.Board) -> np.ndarray:
    """
    Extrae un vector de 69 características numéricas a partir de un objeto chess.Board:
    - 64 casillas del tablero (a1 a h8): valor numérico de la pieza con su signo según color.
    - 1 indicador de turno: +1 para blancas, -1 para negras.
    - 4 indicadores booleanos de derechos de enroque (blancas corto/largo, negras corto/largo).
    """
    features = np.zeros(69, dtype=np.float32)

    # 1. 64 casillas del tablero
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            val = PIECE_VALUES[piece.piece_type]
            features[square] = val if piece.color == chess.WHITE else -val

    # 2. Turno activo
    features[64] = 1.0 if board.turn == chess.WHITE else -1.0

    # 3. Derechos de enroque
    features[65] = 1.0 if board.has_kingside_castling_rights(chess.WHITE) else 0.0
    features[66] = 1.0 if board.has_queenside_castling_rights(chess.WHITE) else 0.0
    features[67] = 1.0 if board.has_kingside_castling_rights(chess.BLACK) else 0.0
    features[68] = 1.0 if board.has_queenside_castling_rights(chess.BLACK) else 0.0

    return features


def extract_features_from_fen(fen: str) -> np.ndarray:
    """
    Parsea una cadena FEN y devuelve su vector de características.
    """
    board = chess.Board(fen)
    return extract_features_from_board(board)
