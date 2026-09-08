'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

class AIModelVersion extends Model {}

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
      comment: 'Cantidad de jugadas usadas en el entrenamiento',
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Métricas del modelo: accuracy, loss, etc.',
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_path',
      comment: 'Ruta al archivo .pkl del modelo entrenado',
    },
  },
  {
    sequelize,
    tableName: 'ai_model_versions',
    underscored: true,
    timestamps: false,
  },
);

module.exports = { AIModelVersion };
