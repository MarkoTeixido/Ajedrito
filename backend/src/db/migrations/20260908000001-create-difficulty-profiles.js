'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Extensión UUID nativa de PostgreSQL (Supabase ya la tiene habilitada)
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryInterface.createTable('difficulty_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      engine_type: {
        type: Sequelize.ENUM('STOCKFISH', 'AI'),
        allowNull: false,
      },
      skill_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      search_depth: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time_limit_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    // Datos semilla: perfiles de dificultad para Stockfish
    await queryInterface.bulkInsert('difficulty_profiles', [
      {
        id: queryInterface.sequelize.literal('uuid_generate_v4()'),
        name: 'Principiante',
        engine_type: 'STOCKFISH',
        skill_level: 1,
        search_depth: 1,
        time_limit_ms: 100,
      },
      {
        id: queryInterface.sequelize.literal('uuid_generate_v4()'),
        name: 'Intermedio',
        engine_type: 'STOCKFISH',
        skill_level: 5,
        search_depth: 5,
        time_limit_ms: 500,
      },
      {
        id: queryInterface.sequelize.literal('uuid_generate_v4()'),
        name: 'Avanzado',
        engine_type: 'STOCKFISH',
        skill_level: 12,
        search_depth: 10,
        time_limit_ms: 1000,
      },
      {
        id: queryInterface.sequelize.literal('uuid_generate_v4()'),
        name: 'Experto',
        engine_type: 'STOCKFISH',
        skill_level: 20,
        search_depth: 20,
        time_limit_ms: 2000,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('difficulty_profiles');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_difficulty_profiles_engine_type;");
  },
};
