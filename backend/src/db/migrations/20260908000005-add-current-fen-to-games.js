'use strict';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('games', 'current_fen', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: INITIAL_FEN,
      comment: 'FEN actual de la partida, actualizado en cada jugada',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('games', 'current_fen');
  },
};
