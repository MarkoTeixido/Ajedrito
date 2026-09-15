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


import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def build_dataset(source_filter: str = None, max_samples: int = 12000) -> Tuple[np.ndarray, List[str], pd.DataFrame]:
    """
    Conecta a la base de datos Supabase mediante SQLAlchemy (modo lectura),
    recupera el historial de movimientos persistidos (incluyendo su origen: SEED o USER)
    y genera las matrices de entrenamiento:
    - X: matriz de features numéricas (N, 69)
    - y: lista de etiquetas de jugadas en formato UCI (ej: 'e2e4', 'e7e5')
    - df: DataFrame de pandas con los registros originales
    """
    engine = create_engine(settings.database_url)

    where_clause = "WHERE m.fen_before IS NOT NULL AND m.san IS NOT NULL"
    if source_filter:
        where_clause += f" AND g.source = '{source_filter}'"

    query = text(
        f"""
        SELECT m.id, m.game_id, m.move_number, m.color, m.san, m.fen_before, m.fen_after, m.created_at,
               COALESCE(g.source, 'USER') AS source
        FROM moves m
        LEFT JOIN games g ON m.game_id = g.id
        {where_clause}
        ORDER BY m.created_at DESC
        """
    )

    print("  [Dataset] Recuperando jugadas persistidas desde Supabase...")
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)

    total_in_db = len(df)
    print(f"  [Dataset] Total de jugadas disponibles en BD: {total_in_db}")

    if df.empty:
        return np.empty((0, 69)), [], df

    # Si hay más de max_samples, priorizamos todas las de USER y completamos con SEED
    if max_samples and len(df) > max_samples:
        user_df = df[df["source"] == "USER"]
        seed_df = df[df["source"] == "SEED"]
        needed_seed = max_samples - len(user_df)
        if needed_seed > 0:
            seed_df = seed_df.sample(n=min(needed_seed, len(seed_df)), random_state=42)
            df = pd.concat([user_df, seed_df]).sample(frac=1.0, random_state=42).reset_index(drop=True)
        else:
            df = user_df.sample(n=max_samples, random_state=42).reset_index(drop=True)
        print(f"  [Dataset] Muestra balanceada seleccionada para entrenamiento: {len(df)} jugadas")

    features_list = []
    labels_list = []
    valid_indices = []

    print(f"  [Dataset] Extrayendo 69 caracteristicas numericas por tablero ({len(df)} posiciones)...")
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
            continue

        if (idx + 1) % 5000 == 0:
            print(f"    Progreso: {idx + 1}/{len(df)} posiciones vectorizadas...")

    X = np.array(features_list, dtype=np.float32) if features_list else np.empty((0, 69))
    y = labels_list
    valid_df = df.loc[valid_indices].reset_index(drop=True)

    print(f"  [Dataset] Dataset construido: {X.shape[0]} muestras vectorizadas listas para entrenamiento.")
    return X, y, valid_df
