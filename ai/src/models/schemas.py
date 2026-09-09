from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class PredictRequest(BaseModel):
    """Petición de predicción de jugada."""
    fen: str = Field(..., description="Posición actual en formato FEN")
    game_id: Optional[str] = Field(None, description="Identificador único de la partida")


class PredictResponse(BaseModel):
    """Respuesta con la jugada seleccionada por la IA propia."""
    san: str = Field(..., description="Notación algebraica estándar (ej: 'Nf3', 'e4')")
    uci: str = Field(..., description="Notación UCI estándar (ej: 'g1f3', 'e2e4')")
    from_square: str = Field(..., alias="from", description="Casilla de origen")
    to_square: str = Field(..., alias="to", description="Casilla de destino")
    promotion: Optional[str] = Field(None, description="Pieza de promoción ('q', 'r', 'b', 'n')")
    confidence: Optional[float] = Field(None, description="Confianza asignada por el modelo (0.0 a 1.0)")
    method: str = Field("ml", description="Método utilizado ('ml' o 'heuristic')")

    class Config:
        populate_by_name = True


class TrainResponse(BaseModel):
    """Respuesta del job batch de entrenamiento."""
    status: str
    dataset_size: int
    classes_count: Optional[int] = None
    train_accuracy: Optional[float] = None
    model_path: Optional[str] = None
    message: Optional[str] = None
