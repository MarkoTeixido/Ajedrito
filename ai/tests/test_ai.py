"""
Pruebas unitarias para el microservicio de IA (Pytest).
"""
import pytest
import chess
from fastapi.testclient import TestClient

from src.main import app
from src.ml.feature_extractor import extract_features_from_fen
from src.ml.predictor import predict_move

client = TestClient(app)


def test_feature_extractor_shape_and_turn():
    initial_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    features = extract_features_from_fen(initial_fen)

    # 64 casillas + 1 turno + 4 derechos de enroque = 69
    assert features.shape == (69,)
    assert features[64] == 1.0  # Turno de blancas
    assert features[65] == 1.0  # Enroque blanco corto


def test_predictor_always_returns_legal_move():
    initial_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    result = predict_move(initial_fen)

    assert "san" in result
    assert "uci" in result
    assert "from" in result
    assert "to" in result
    assert "confidence" in result
    assert result["method"] in ["ml", "heuristic"]

    # Verificar que la jugada devuelta es 100% legal en el tablero
    board = chess.Board(initial_fen)
    legal_ucis = [m.uci() for m in board.legal_moves]
    assert result["uci"] in legal_ucis


def test_predictor_handles_black_turn():
    fen_after_e4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
    result = predict_move(fen_after_e4)

    board = chess.Board(fen_after_e4)
    legal_ucis = [m.uci() for m in board.legal_moves]
    assert result["uci"] in legal_ucis


def test_predictor_rejects_game_over_position():
    # Jaque mate del pastor
    scholars_mate_fen = "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4"
    with pytest.raises(ValueError, match="partida terminada"):
        predict_move(scholars_mate_fen)


def test_predict_endpoint_via_http():
    response = client.post(
        "/predict",
        json={"fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "san" in data
    assert "uci" in data
    assert "from" in data
    assert "to" in data
    assert data["from"] is not None
    assert data["to"] is not None
