"""
Pruebas unitarias para la política de dificultad adaptativa de Ajedrito (src/ml/difficulty.py).
"""
import pytest

from src.ml.difficulty import DifficultyPolicy, resolve_adaptive_level
from src.core.constants import (
    ADAPTIVE_BENEVOLENT,
    ADAPTIVE_STANDARD,
    ADAPTIVE_CHALLENGING,
    DIFFICULTY_ADAPTIVE,
    DIFFICULTY_EASY,
    DIFFICULTY_HARD,
    DIFFICULTY_MEDIUM,
)


@pytest.mark.parametrize(
    "difficulty, balance, expected",
    [
        # Modo adaptativo
        (DIFFICULTY_ADAPTIVE, 4, ADAPTIVE_BENEVOLENT),
        (DIFFICULTY_ADAPTIVE, 9, ADAPTIVE_BENEVOLENT),
        (DIFFICULTY_ADAPTIVE, -2, ADAPTIVE_CHALLENGING),
        (DIFFICULTY_ADAPTIVE, -5, ADAPTIVE_CHALLENGING),
        (DIFFICULTY_ADAPTIVE, 0, ADAPTIVE_STANDARD),
        (DIFFICULTY_ADAPTIVE, 3, ADAPTIVE_STANDARD),
        (DIFFICULTY_ADAPTIVE, -1, ADAPTIVE_STANDARD),
        # Modos fijos
        (DIFFICULTY_EASY, 0, ADAPTIVE_BENEVOLENT),
        (DIFFICULTY_EASY, -5, ADAPTIVE_BENEVOLENT),
        (DIFFICULTY_HARD, 0, ADAPTIVE_CHALLENGING),
        (DIFFICULTY_HARD, 5, ADAPTIVE_CHALLENGING),
        (DIFFICULTY_MEDIUM, 0, ADAPTIVE_STANDARD),
        # Fallbacks con strings vacíos o variantes de casing
        ("ADAPTIVE", 0, ADAPTIVE_STANDARD),
        ("easy", 0, ADAPTIVE_BENEVOLENT),
        ("Hard", 0, ADAPTIVE_CHALLENGING),
        (None, 0, ADAPTIVE_STANDARD),
        ("unknown_policy", 0, ADAPTIVE_STANDARD),
    ],
)
def test_resolve_adaptive_level(difficulty, balance, expected):
    assert resolve_adaptive_level(difficulty, balance) == expected
