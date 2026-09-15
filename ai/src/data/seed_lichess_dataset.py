"""
Script para descargar, procesar e insertar masivamente partidas reales de Lichess
divididas en 3 niveles de habilidad (Principiante, Intermedio y Avanzado)
para resolver el arranque en frío (Cold Start) de Ajedrito a escala.
Todas las partidas se insertan con source = 'SEED'.
"""
import io
import time
import uuid
import sys
import urllib.request
from typing import List, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import chess.pgn
import psycopg2
from psycopg2.extras import execute_values

from src.config import settings

# Perfiles de jugadores representativos de Lichess para cubrir los 3 niveles
LEVEL_TARGETS = [
    {
        "name": "Principiante (Elo ~1100-1300)",
        "username": "maia1",
        "target_games": 400,
    },
    {
        "name": "Intermedio (Elo ~1400-1650)",
        "username": "maia5",
        "target_games": 400,
    },
    {
        "name": "Avanzado (Elo ~1800-2100)",
        "username": "maia9",
        "target_games": 400,
    },
]


def fetch_lichess_pgn(username: str, max_games: int) -> str:
    """
    Descarga en streaming partidas evaluadas desde la API oficial de Lichess.
    """
    url = f"https://lichess.org/api/games/user/{username}?max={max_games}&rated=true"
    headers = {
        "Accept": "application/x-chess-pgn",
        "User-Agent": "Ajedrito-Education/1.0 (Contact: local@ajedrito.dev)",
    }
    req = urllib.request.Request(url, headers=headers)
    print(f"  ⬇️ Descargando {max_games} partidas para '{username}' desde Lichess...")
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_result(result_str: str) -> str:
    if result_str == "1-0":
        return "WHITE_WINS"
    elif result_str == "0-1":
        return "BLACK_WINS"
    else:
        return "DRAW"


def process_pgn_stream(pgn_text: str, target_count: int) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parsea las partidas PGN y genera tuplas de datos para games y moves.
    """
    pgn_io = io.StringIO(pgn_text)
    games_data = []
    moves_data = []
    parsed_count = 0

    while parsed_count < target_count:
        game = chess.pgn.read_game(pgn_io)
        if game is None:
            break

        board = game.board()
        game_id = str(uuid.uuid4())
        result = parse_result(game.headers.get("Result", "*"))

        moves_in_game = list(game.mainline_moves())
        # Omitir partidas extremadamente cortas o abandonos instantáneos (< 6 jugadas)
        if len(moves_in_game) < 6:
            continue

        move_num = 1
        for move in moves_in_game:
            fen_before = board.fen()
            san = board.san(move)
            color = "white" if board.turn == chess.WHITE else "black"
            board.push(move)
            fen_after = board.fen()

            moves_data.append({
                "id": str(uuid.uuid4()),
                "game_id": game_id,
                "move_number": move_num,
                "color": color,
                "san": san,
                "fen_before": fen_before,
                "fen_after": fen_after,
                "time_spent_ms": 1000,
            })
            move_num += 1

        games_data.append({
            "id": game_id,
            "mode": "PVP",
            "white_type": "HUMAN",
            "black_type": "HUMAN",
            "result": result,
            "current_fen": board.fen(),
            "source": "SEED",
        })

        parsed_count += 1

    return games_data, moves_data


def bulk_insert(games_data: List[Dict[str, Any]], moves_data: List[Dict[str, Any]]) -> None:
    """
    Inserta masivamente usando execute_values de psycopg2 para máxima velocidad.
    """
    conn = psycopg2.connect(settings.database_url)
    try:
        with conn.cursor() as cur:
            print(f"  💾 Insertando {len(games_data)} partidas en tabla 'games'...")
            games_tuples = [
                (
                    g["id"],
                    g["mode"],
                    g["white_type"],
                    g["black_type"],
                    g["result"],
                    g["current_fen"],
                    g["source"],
                )
                for g in games_data
            ]
            execute_values(
                cur,
                """
                INSERT INTO games (id, mode, white_type, black_type, result, current_fen, source)
                VALUES %s
                """,
                games_tuples,
                page_size=500,
            )

            print(f"  💾 Insertando {len(moves_data)} jugadas en tabla 'moves' en lotes...")
            moves_tuples = [
                (
                    m["id"],
                    m["game_id"],
                    m["move_number"],
                    m["color"],
                    m["san"],
                    m["fen_before"],
                    m["fen_after"],
                    m["time_spent_ms"],
                )
                for m in moves_data
            ]
            execute_values(
                cur,
                """
                INSERT INTO moves (id, game_id, move_number, color, san, fen_before, fen_after, time_spent_ms)
                VALUES %s
                """,
                moves_tuples,
                page_size=1000,
            )

        conn.commit()
        print("  ✅ Lote de partidas y jugadas confirmado en la base de datos.")
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Error en bulk_insert: {e}")
        raise
    finally:
        conn.close()


def run_seeding_pipeline():
    print("=" * 65)
    print("🚀 INICIANDO SEEDING REAL DE LICHESS POR NIVELES (COLD START)")
    print("=" * 65)

    start_total = time.time()
    total_games_all = 0
    total_moves_all = 0

    for level in LEVEL_TARGETS:
        print(f"\n🎯 Procesando Nivel: {level['name']}")
        try:
            pgn_text = fetch_lichess_pgn(level["username"], level["target_games"])
            games, moves = process_pgn_stream(pgn_text, level["target_games"])
            print(f"  ♟️ Partidas parseadas: {len(games)} | Jugadas individuales: {len(moves)}")

            if games:
                bulk_insert(games, moves)
                total_games_all += len(games)
                total_moves_all += len(moves)

            # Pequeña pausa de cortesía para la API de Lichess
            time.sleep(1)
        except Exception as err:
            print(f"  ⚠️ Error en nivel {level['name']}: {err}")

    elapsed = round(time.time() - start_total, 2)
    print("\n" + "=" * 65)
    print(f"🎉 SEEDING MASIVO COMPLETADO EN {elapsed}s")
    print(f"   - Total partidas insertadas (source='SEED'): {total_games_all}")
    print(f"   - Total jugadas persistidas: {total_moves_all}")
    print("=" * 65)


if __name__ == "__main__":
    run_seeding_pipeline()
