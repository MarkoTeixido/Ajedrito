"""
Gestor de dificultad adaptativa para Ajedrito.
Responsabilidad única (SRP): determinar el nivel adaptativo ('benevolent', 'standard', 'challenging')
según la política de juego seleccionada y el balance de material en el tablero.
"""
from src.core.constants import (
    ADAPTIVE_BENEVOLENT,
    ADAPTIVE_STANDARD,
    ADAPTIVE_CHALLENGING,
    DIFFICULTY_ADAPTIVE,
    DIFFICULTY_EASY,
    DIFFICULTY_HARD,
)

# Umbrales de material para adaptación dinámica
BENEVOLENT_MATERIAL_THRESHOLD = 4
CHALLENGING_MATERIAL_THRESHOLD = -2


class DifficultyPolicy:
    """
    Determina el nivel de exigencia táctica de la IA para mantener partidas
    equilibradas y pedagógicamente estimulantes.
    """

    @staticmethod
    def resolve_adaptive_level(difficulty: str, material_balance: int) -> str:
        """
        Calcula el nivel adaptativo a aplicar.
        - difficulty == 'adaptive':
            * balance >= 4 -> 'benevolent' (dar respiro al usuario)
            * balance <= -2 -> 'challenging' (exigir más tácticamente)
            * otro -> 'standard'
        - difficulty == 'easy' -> 'benevolent'
        - difficulty == 'hard' -> 'challenging'
        - cualquier otro -> 'standard'
        """
        diff = (difficulty or DIFFICULTY_ADAPTIVE).lower().strip()

        if diff == DIFFICULTY_ADAPTIVE:
            if material_balance >= BENEVOLENT_MATERIAL_THRESHOLD:
                return ADAPTIVE_BENEVOLENT
            elif material_balance <= CHALLENGING_MATERIAL_THRESHOLD:
                return ADAPTIVE_CHALLENGING
            return ADAPTIVE_STANDARD
        elif diff == DIFFICULTY_EASY:
            return ADAPTIVE_BENEVOLENT
        elif diff == DIFFICULTY_HARD:
            return ADAPTIVE_CHALLENGING

        return ADAPTIVE_STANDARD


resolve_adaptive_level = DifficultyPolicy.resolve_adaptive_level
