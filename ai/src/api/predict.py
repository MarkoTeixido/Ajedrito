"""
Rutas de predicción y entrenamiento para el microservicio de IA de Ajedrito.
Los endpoints utilizan funciones 'def' síncronas estándar para que FastAPI
los despache automáticamente al threadpool de Starlette, previniendo el
bloqueo del event loop de asyncio durante inferencias o reentrenamientos.
"""
from fastapi import APIRouter, HTTPException
from src.core.logging import get_logger
from src.models.schemas import PredictRequest, PredictResponse, TrainResponse
from src.ml.predictor import predict_move
from src.ml.trainer import train_model

logger = get_logger(__name__)

router = APIRouter(prefix="", tags=["ai"])


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    """
    Recibe un FEN y devuelve la próxima mejor jugada legal según el modelo entrenado
    y la política de dificultad adaptativa.
    """
    try:
        result = predict_move(req.fen, difficulty=req.difficulty or "adaptive")
        return PredictResponse(
            san=result["san"],
            uci=result["uci"],
            from_square=result["from"],
            to_square=result["to"],
            promotion=result["promotion"],
            confidence=result["confidence"],
            method=result["method"],
            adaptive_level=result.get("adaptive_level", "standard"),
        )
    except ValueError as err:
        logger.warning(f"Peticion de prediccion rechazada: {err}")
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        logger.error(f"Error inesperado en inferencia de IA: {err}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error en inferencia de IA: {str(err)}")


@router.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    """
    Dispara un job batch de entrenamiento leyendo las jugadas de la base de datos.
    Persiste el modelo actualizado en formato .joblib y refresca la caché en memoria.
    """
    try:
        result = train_model()
        return TrainResponse(**result)
    except Exception as err:
        logger.error(f"Error inesperado durante el entrenamiento: {err}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error durante entrenamiento: {str(err)}")
