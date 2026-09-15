"""
Punto de entrada de Ajedrito AI Service.
Inicia la aplicación FastAPI y expone los routers de health y predict.
Correr con: uvicorn src.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.core.logging import get_logger
from src.ml.model_registry import ModelRegistry
from src.api.health import router as health_router
from src.api.predict import router as predict_router

logger = get_logger("ajedrito.ai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación:
    Pre-carga el modelo en memoria durante el inicio para acelerar la primera petición.
    """
    logger.info("Iniciando Ajedrito AI Service...")
    model = ModelRegistry.load_model()
    if model is not None:
        logger.info("Modelo de ajedrez precargado exitosamente en memoria.")
    else:
        logger.info("Iniciando en modo evaluador heurístico puro.")
    yield
    logger.info("Deteniendo Ajedrito AI Service.")


app = FastAPI(
    title="Ajedrito AI Service",
    description="Servicio de predicción de jugadas con modelo propio (scikit-learn)",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — orígenes configurables desde variables de entorno o defaults de desarrollo
origins = settings.cors_origins if isinstance(settings.cors_origins, list) else [settings.cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(predict_router)


@app.get("/", include_in_schema=False)
def root():
    return {"service": "ajedrito-ai", "version": "0.1.0"}
