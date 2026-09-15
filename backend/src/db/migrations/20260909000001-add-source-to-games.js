'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna 'source' a la tabla 'games'
    await queryInterface.addColumn('games', 'source', {
      type: Sequelize.ENUM('USER', 'SEED'),
      allowNull: false,
      defaultValue: 'USER',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('games', 'source');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_games_source";');
  },
};
