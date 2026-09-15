"""
Trainer del modelo de IA propia de Ajedrito.
Entrena un clasificador RandomForest de scikit-learn con las jugadas persistidas
en la base de datos y serializa el modelo entrenado en formato joblib.
"""
from typing import Dict, Any
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

from src.core.constants import MODELS_DIR, MODEL_FILE
from src.core.logging import get_logger
from src.data.dataset_builder import build_dataset
from src.ml.model_registry import ModelRegistry

logger = get_logger(__name__)


def train_model() -> Dict[str, Any]:
    """
    Construye el dataset de entrenamiento desde la base de datos,
    entrena el clasificador RandomForest, persiste el artefacto .joblib
    y actualiza la caché en memoria del ModelRegistry.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    X, y, df = build_dataset()

    seed_count = int((df["source"] == "SEED").sum()) if "source" in df.columns else 0
    user_count = int((df["source"] == "USER").sum()) if "source" in df.columns else len(df)

    if len(X) == 0 or len(y) == 0:
        return {
            "status": "error",
            "message": "No hay suficientes jugadas en la base de datos para entrenar.",
            "dataset_size": 0,
        }

    unique_classes = set(y)
    if len(unique_classes) < 2:
        return {
            "status": "warning",
            "message": "Se necesitan al menos 2 jugadas diferentes en la base de datos para entrenar.",
            "dataset_size": len(X),
            "classes_count": len(unique_classes),
        }

    logger.info(f"Entrenando RandomForestClassifier ({len(unique_classes)} clases distintas, {len(X)} ejemplos)...")
    clf = RandomForestClassifier(
        n_estimators=35,
        max_depth=12,
        max_leaf_nodes=400,
        min_samples_split=8,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    clf.fit(X, y)
    logger.info("Modelo ajustado con exito. Evaluando precision...")

    # Evaluar precisión sobre el conjunto de entrenamiento
    train_preds = clf.predict(X)
    acc = accuracy_score(y, train_preds)

    # Persistir el artefacto entrenado
    joblib.dump(clf, MODEL_FILE)
    logger.info(f"Artefacto persistido en {MODEL_FILE}")

    # Actualizar la caché del registro del modelo en memoria
    ModelRegistry.set_model(clf)

    return {
        "status": "success",
        "dataset_size": len(X),
        "seed_moves": seed_count,
        "user_moves": user_count,
        "classes_count": len(clf.classes_),
        "train_accuracy": round(float(acc), 4),
        "model_path": str(MODEL_FILE),
    }


if __name__ == "__main__":
    result = train_model()
    print("Resultado del entrenamiento:", result)
