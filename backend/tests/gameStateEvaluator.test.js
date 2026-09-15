'use strict';

const { Chess } = require('chess.js');

// Mock del modelo Game para evitar inicializar Sequelize en los tests
jest.mock('../src/db/models/Game', () => ({
  GameResult: {
    WHITE_WINS:  'WHITE_WINS',
    BLACK_WINS:  'BLACK_WINS',
    DRAW:        'DRAW',
    IN_PROGRESS: 'IN_PROGRESS',
  },
}));

const { GameStateEvaluator } = require('../src/services/GameStateEvaluator');

describe('GameStateEvaluator', () => {
  describe('evaluate(chess, moveResult)', () => {
    test('detecta jaque mate de blancas (WHITE_WINS)', () => {
      // Mate del Loco: 1. f3 e5 2. g4 Qh4#
      const chess = new Chess();
      chess.move({ from: 'f2', to: 'f3' });
      chess.move({ from: 'e7', to: 'e5' });
      chess.move({ from: 'g2', to: 'g4' });
      const move = chess.move({ from: 'd8', to: 'h4' }); // negras hacen el mate

      const result = GameStateEvaluator.evaluate(chess, move);

      expect(result.isGameOver).toBe(true);
      expect(result.result).toBe('BLACK_WINS');
    });

    test('detecta jaque mate de negras (BLACK_WINS)', () => {
      // Mate del Pastor: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
      const chess = new Chess();
      chess.move({ from: 'e2', to: 'e4' });
      chess.move({ from: 'e7', to: 'e5' });
      chess.move({ from: 'f1', to: 'c4' });
      chess.move({ from: 'b8', to: 'c6' });
      chess.move({ from: 'd1', to: 'h5' });
      chess.move({ from: 'g8', to: 'f6' });
      const move = chess.move({ from: 'h5', to: 'f7' }); // blancas hacen el mate

      const result = GameStateEvaluator.evaluate(chess, move);

      expect(result.isGameOver).toBe(true);
      expect(result.result).toBe('WHITE_WINS');
    });

    test('detecta tablas por ahogado (DRAW)', () => {
      // Rey negro atrapado — ahogado clásico
      const chess = new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1');

      // Creamos un fake moveResult — en este FEN el juego ya es stalemate antes de mover
      // Simulamos el estado con un move ficticio para testear evaluate() aislado
      const fakeMove = { color: 'w' };
      const result = GameStateEvaluator.evaluate(chess, fakeMove);

      expect(result.isGameOver).toBe(true);
      expect(result.result).toBe('DRAW');
    });

    test('retorna IN_PROGRESS cuando la partida continua', () => {
      const chess = new Chess();
      const move = chess.move({ from: 'e2', to: 'e4' });

      const result = GameStateEvaluator.evaluate(chess, move);

      expect(result.isGameOver).toBe(false);
      expect(result.result).toBe('IN_PROGRESS');
    });

    test('detecta tablas por material insuficiente (rey vs rey)', () => {
      const chess = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
      const fakeMove = { color: 'w' };

      const result = GameStateEvaluator.evaluate(chess, fakeMove);

      expect(result.isGameOver).toBe(true);
      expect(result.result).toBe('DRAW');
    });
  });
});
