import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ModelMetrics {
  accuracy?: number;
  loss?: number;
  [key: string]: unknown;
}

interface AIModelVersionAttributes {
  id: string;
  trainedAt: Date;
  datasetSize: number;    // Cantidad de jugadas usadas en el entrenamiento
  metrics: ModelMetrics;  // Métricas de evaluación (JSON)
  filePath: string;       // Ruta al archivo del modelo (.pkl)
}

type AIModelVersionCreationAttributes = Optional<
  AIModelVersionAttributes,
  'id' | 'trainedAt'
>;

// ── Modelo ───────────────────────────────────────────────────────────────────

export class AIModelVersion
  extends Model<AIModelVersionAttributes, AIModelVersionCreationAttributes>
  implements AIModelVersionAttributes
{
  declare id: string;
  declare trainedAt: Date;
  declare datasetSize: number;
  declare metrics: ModelMetrics;
  declare filePath: string;
}

AIModelVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trainedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'trained_at',
    },
    datasetSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dataset_size',
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path',
    },
  },
  {
    sequelize,
    tableName: 'ai_model_versions',
    underscored: true,
    timestamps: false,
  },
);
