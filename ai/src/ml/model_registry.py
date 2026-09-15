"""
Registro y ciclo de vida del modelo de Machine Learning para Ajedrito.
Responsabilidad única (SRP): gestionar la carga, caché en memoria y persistencia
del artefacto joblib del modelo.
"""
from pathlib import Path
from typing import Any, Optional
import joblib

from src.core.constants import MODEL_FILE
from src.core.logging import get_logger

logger = get_logger(__name__)


class ModelRegistry:
    """
    Gestiona el artefacto serializado del modelo y su caché en memoria.
    """
    _cached_model: Optional[Any] = None

    @classmethod
    def load_model(cls, model_path: Optional[Path] = None, force_reload: bool = False) -> Optional[Any]:
        """
        Carga o retorna desde la memoria caché el modelo entrenado de scikit-learn.
        Si no existe el archivo o falla la deserialización, retorna None con logging seguro.
        """
        if cls._cached_model is not None and not force_reload:
            return cls._cached_model

        target_path = model_path or MODEL_FILE
        if not target_path.exists():
            logger.warning(f"No se encontro el archivo del modelo en {target_path}. Se utilizara evaluacion heuristica.")
            cls._cached_model = None
            return None

        try:
            logger.info(f"Cargando modelo de ajedrez desde {target_path}...")
            cls._cached_model = joblib.load(target_path)
            logger.info("Modelo cargado exitosamente en memoria.")
            return cls._cached_model
        except Exception as err:
            logger.error(f"Error al deserializar el modelo desde {target_path}: {err}", exc_info=True)
            cls._cached_model = None
            return None

    @classmethod
    def set_model(cls, model: Any) -> None:
        """Establece directamente el modelo en caché (útil para testing o tras reentrenar)."""
        cls._cached_model = model

    @classmethod
    def clear_cache(cls) -> None:
        """Invalida la caché en memoria del modelo."""
        cls._cached_model = None

    @classmethod
    def is_model_loaded(cls) -> bool:
        """Indica si el modelo ya se encuentra cargado en memoria."""
        return cls._cached_model is not None


# Función de compatibilidad
load_model = ModelRegistry.load_model
