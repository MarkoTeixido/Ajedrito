from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class PredictRequest(BaseModel):
    """Petición de predicción de jugada."""
    fen: str
    game_id: str


class PredictResponse(BaseModel):
    """Respuesta con la jugada sugerida por el modelo."""
    san: str
    confidence: float | None = None
