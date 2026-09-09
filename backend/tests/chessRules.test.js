'use strict';

const { Chess } = require('chess.js');

describe('Chess rule engine & validation', () => {
  test('validates legal opening move', () => {
    const chess = new Chess();
    const move = chess.move({ from: 'e2', to: 'e4' });

    expect(move).not.toBeNull();
    expect(move.san).toBe('e4');
    expect(move.color).toBe('w');
    expect(chess.turn()).toBe('b');
  });

  test('rejects illegal move', () => {
    const chess = new Chess();
    expect(() => {
      chess.move({ from: 'e2', to: 'e5' });
    }).toThrow();
  });

  test('detects checkmate properly (Fool\'s Mate)', () => {
    const chess = new Chess();
    chess.move('f3');
    chess.move('e5');
    chess.move('g4');
    const winningMove = chess.move('Qh4#');

    expect(winningMove).toBeDefined();
    expect(chess.isCheckmate()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
  });
});
