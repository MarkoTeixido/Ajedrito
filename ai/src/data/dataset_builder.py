"""
Dataset builder para el ai-service.
Lee la tabla moves de Supabase (solo lectura) y construye
el dataset de entrenamiento a partir de jugadas individuales.
"""
from typing import Tuple, List
import pandas as pd
import numpy as np
import chess
from sqlalchemy import create_engine, text

from src.config import settings
from src.ml.feature_extractor import extract_features_from_board


def build_dataset() -> Tuple[np.ndarray, List[str], pd.DataFrame]:
    """
    Conecta a la base de datos Supabase mediante SQLAlchemy (modo lectura),
    recupera el historial de movimientos persistidos y genera las matrices de entrenamiento:
    - X: matriz de features numéricas (N, 69)
    - y: lista de etiquetas de jugadas en formato UCI (ej: 'e2e4', 'e7e5')
    - df: DataFrame de pandas con los registros originales
    """
    engine = create_engine(settings.database_url)

    query = text(
        """
        SELECT id, game_id, move_number, color, san, fen_before, fen_after, created_at
        FROM moves
        WHERE fen_before IS NOT NULL AND san IS NOT NULL
        ORDER BY created_at ASC
        """
    )

    with engine.connect() as conn:
        df = pd.read_sql(query, conn)

    if df.empty:
        return np.empty((0, 69)), [], df

    features_list = []
    labels_list = []
    valid_indices = []

    for idx, row in df.iterrows():
        fen = row["fen_before"]
        san = row["san"]

        try:
            board = chess.Board(fen)
            move = board.parse_san(san)
            features = extract_features_from_board(board)

            features_list.append(features)
            labels_list.append(move.uci())
            valid_indices.append(idx)
        except Exception:
            # Si un FEN o SAN antiguo tiene alguna inconsistencia, se omite de forma segura
            continue

    X = np.array(features_list, dtype=np.float32) if features_list else np.empty((0, 69))
    y = labels_list
    valid_df = df.loc[valid_indices].reset_index(drop=True)

    return X, y, valid_df
