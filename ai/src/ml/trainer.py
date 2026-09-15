"""
Trainer del modelo de IA propia.
Entrena un clasificador de scikit-learn con las jugadas persistidas
en Supabase y serializa el modelo entrenado en formato joblib.
"""
from pathlib import Path
from typing import Dict, Any
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

from src.data.dataset_builder import build_dataset

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_FILE = MODELS_DIR / "chess_model.joblib"


def train_model() -> Dict[str, Any]:
    """
    Construye el dataset de entrenamiento desde Supabase,
    entrena el clasificador RandomForest y persiste el artefacto .joblib.
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

    # Si hay muy pocas clases distintas (ej. 1 sola jugada en la base),
    # duplicamos o usamos un clasificador adecuado
    unique_classes = set(y)
    if len(unique_classes) < 2:
        return {
            "status": "warning",
            "message": "Se necesitan al menos 2 jugadas diferentes en la base de datos para entrenar.",
            "dataset_size": len(X),
            "classes_count": len(unique_classes),
        }

    print(f"  [Trainer] Entrenando RandomForestClassifier ({len(unique_classes)} clases distintas, {len(X)} ejemplos)...")
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
    print("  [Trainer] Modelo ajustado con exito. Evaluando precision...")

    # Evaluar precisión sobre el conjunto de entrenamiento
    train_preds = clf.predict(X)
    acc = accuracy_score(y, train_preds)

    # Persistir el artefacto entrenado
    joblib.dump(clf, MODEL_FILE)
    print(f"  [Trainer] Artefacto persistido en {MODEL_FILE}")

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
