'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('moves', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      game_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'games',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      move_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      color: {
        type: Sequelize.ENUM('white', 'black'),
        allowNull: false,
      },
      san: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Standard Algebraic Notation, ej: e4, Nf3, O-O',
      },
      fen_before: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'FEN de la posición antes de la jugada',
      },
      fen_after: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'FEN de la posición después de la jugada',
      },
      eval_score: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Evaluación del motor en centipawns (null si no disponible)',
      },
      time_spent_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tiempo que tardó el jugador/motor en realizar la jugada',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Índices clave para el armado del dataset de entrenamiento
    await queryInterface.addIndex('moves', ['game_id']);
    await queryInterface.addIndex('moves', ['game_id', 'move_number']);
    await queryInterface.addIndex('moves', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('moves');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_moves_color;");
  },
};
