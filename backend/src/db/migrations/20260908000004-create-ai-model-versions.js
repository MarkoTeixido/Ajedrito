'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_model_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      trained_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      dataset_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Número de jugadas usadas en el entrenamiento',
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Métricas del modelo: accuracy, loss, etc.',
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Ruta al archivo .pkl del modelo entrenado',
      },
    });

    await queryInterface.addIndex('ai_model_versions', ['trained_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_model_versions');
  },
};
