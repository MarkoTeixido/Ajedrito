"""
Rutas de predicción y entrenamiento para el AI service.
"""
from fastapi import APIRouter, HTTPException
from src.models.schemas import PredictRequest, PredictResponse, TrainResponse
from src.ml.predictor import predict_move
from src.ml.trainer import train_model

router = APIRouter(prefix="", tags=["ai"])


@router.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    Recibe un FEN y devuelve la próxima mejor jugada legal según el modelo entrenado.
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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en inferencia de IA: {str(e)}")


@router.post("/train", response_model=TrainResponse)
async def train():
    """
    Dispara un job batch de entrenamiento leyendo las jugadas de Supabase.
    Persiste el modelo actualizado en formato .joblib.
    """
    try:
        result = train_model()
        return TrainResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante entrenamiento: {str(e)}")
