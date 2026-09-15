"""
Pruebas unitarias para el registro de modelos de Ajedrito (src/ml/model_registry.py).
"""
from pathlib import Path
from unittest.mock import MagicMock, patch

from src.ml.model_registry import ModelRegistry


def test_model_registry_cache_and_clear():
    fake_model = MagicMock()
    ModelRegistry.set_model(fake_model)

    assert ModelRegistry.is_model_loaded() is True
    assert ModelRegistry.load_model() == fake_model

    ModelRegistry.clear_cache()
    assert ModelRegistry.is_model_loaded() is False


def test_model_registry_missing_file_returns_none(tmp_path: Path):
    ModelRegistry.clear_cache()
    non_existent = tmp_path / "does_not_exist.joblib"

    result = ModelRegistry.load_model(model_path=non_existent)
    assert result is None
    assert ModelRegistry.is_model_loaded() is False


def test_model_registry_corrupt_file_returns_none(tmp_path: Path):
    ModelRegistry.clear_cache()
    corrupt_file = tmp_path / "corrupt.joblib"
    corrupt_file.write_text("not a joblib file", encoding="utf-8")

    result = ModelRegistry.load_model(model_path=corrupt_file)
    assert result is None
    assert ModelRegistry.is_model_loaded() is False


def test_model_registry_loads_real_model():
    # Carga el modelo real existente si está presente en disco
    ModelRegistry.clear_cache()
    model = ModelRegistry.load_model()
    # Si existe el archivo de modelo serializado, debe haberse cargado
    if model is not None:
        assert hasattr(model, "predict")
        assert ModelRegistry.is_model_loaded() is True
