'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('games', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      mode: {
        type: Sequelize.ENUM('PVP', 'PV_STOCKFISH', 'PV_AI'),
        allowNull: false,
      },
      white_type: {
        type: Sequelize.ENUM('HUMAN', 'STOCKFISH', 'AI'),
        allowNull: false,
      },
      black_type: {
        type: Sequelize.ENUM('HUMAN', 'STOCKFISH', 'AI'),
        allowNull: false,
      },
      difficulty_profile_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'difficulty_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      result: {
        type: Sequelize.ENUM('IN_PROGRESS', 'WHITE_WINS', 'BLACK_WINS', 'DRAW'),
        allowNull: false,
        defaultValue: 'IN_PROGRESS',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Índice para consultas de historial
    await queryInterface.addIndex('games', ['mode']);
    await queryInterface.addIndex('games', ['result']);
    await queryInterface.addIndex('games', ['started_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('games');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_games_mode;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_games_white_type;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_games_black_type;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_games_result;");
  },
};
