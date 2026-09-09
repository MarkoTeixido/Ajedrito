'use strict';

const { Chess } = require('chess.js');

describe('Ajedrito Chess Rules & Edge Cases Engine', () => {
  describe('Movimientos básicos y alternancia de turnos', () => {
    test('inicia en turno de blancas y alterna a negras', () => {
      const chess = new Chess();
      expect(chess.turn()).toBe('w');

      chess.move({ from: 'e2', to: 'e4' });
      expect(chess.turn()).toBe('b');

      chess.move({ from: 'e7', to: 'e5' });
      expect(chess.turn()).toBe('w');
    });

    test('rechaza mover una pieza del color que no tiene el turno', () => {
      const chess = new Chess();
      // Turno de blancas: intentar mover una pieza negra (e7 a e5)
      expect(() => {
        chess.move({ from: 'e7', to: 'e5' });
      }).toThrow();
    });

    test('rechaza casillas inexistentes o fuera del tablero', () => {
      const chess = new Chess();
      expect(() => {
        chess.move({ from: 'z9', to: 'e4' });
      }).toThrow();
    });

    test('rechaza atravesar otras piezas con un alfil o torre', () => {
      const chess = new Chess();
      // Torre en a1 no puede saltar peón en a2
      expect(() => {
        chess.move({ from: 'a1', to: 'a3' });
      }).toThrow();
    });
  });

  describe('Partidas completas y detección de fin de partida', () => {
    test('Mate del Loco (Fool\'s Mate) — partida más rápida en 2 jugadas', () => {
      const chess = new Chess();
      // 1. f3 e5 2. g4 Qh4#
      chess.move({ from: 'f2', to: 'f3' });
      chess.move({ from: 'e7', to: 'e5' });
      chess.move({ from: 'g2', to: 'g4' });
      const winMove = chess.move({ from: 'd8', to: 'h4' });

      expect(winMove.san).toBe('Qh4#');
      expect(chess.isCheck()).toBe(true);
      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
      expect(winMove.color).toBe('b'); // Ganan negras
    });

    test('Mate del Pastor (Scholar\'s Mate) — jaque mate típico en 4 jugadas', () => {
      const chess = new Chess();
      // 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
      chess.move({ from: 'e2', to: 'e4' });
      chess.move({ from: 'e7', to: 'e5' });
      chess.move({ from: 'f1', to: 'c4' });
      chess.move({ from: 'b8', to: 'c6' });
      chess.move({ from: 'd1', to: 'h5' });
      chess.move({ from: 'g8', to: 'f6' });
      const mate = chess.move({ from: 'h5', to: 'f7' });

      expect(mate.san).toBe('Qxf7#');
      expect(chess.isCheckmate()).toBe(true);
      expect(chess.isGameOver()).toBe(true);
      expect(mate.color).toBe('w'); // Ganan blancas
    });

    test('Detección de Tablas por Ahogado (Stalemate)', () => {
      // Posición conocida de ahogado: rey negro en a8, rey blanco en c7, dama en b6
      const stalemateFen = 'k7/2R5/1K6/8/8/8/8/8 b - - 0 1';
      // Negras no tienen movimientos legales y no están en jaque
      const chess = new Chess('k7/8/1K6/8/8/8/8/8 b - - 0 1'); // FEN simple
      // Probemos con FEN estándar de rey ahogado
      const kingTrapped = new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1');
      expect(kingTrapped.isCheck()).toBe(false);
      expect(kingTrapped.isStalemate()).toBe(true);
      expect(kingTrapped.isGameOver()).toBe(true);
    });
  });

  describe('Reglas especiales del ajedrez (FIDE)', () => {
    test('Enroque corto (O-O) y enroque largo (O-O-O)', () => {
      // Posición donde blancas pueden enrocar corto
      const chess = new Chess('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 1 6');
      const castleShort = chess.move({ from: 'e1', to: 'g1' });
      expect(castleShort).toBeDefined();
      expect(castleShort.san).toBe('O-O');
      // La torre debe haberse movido a f1
      const pieceAtF1 = chess.get('f1');
      expect(pieceAtF1).toEqual({ type: 'r', color: 'w' });
    });

    test('Captura al paso (En Passant)', () => {
      // Blancas peón en e5, negras mueven d7 a d5
      const chess = new Chess('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
      // Blancas capturan al paso e5xd6
      const enPassant = chess.move({ from: 'e5', to: 'd6' });
      expect(enPassant.san).toBe('exd6');
      // El peón negro en d5 debe haber desaparecido (casilla vacía = undefined)
      expect(chess.get('d5')).toBeUndefined();
      // El peón blanco debe estar en d6
      expect(chess.get('d6')).toEqual({ type: 'p', color: 'w' });
    });

    test('Promoción de peón a Reina al alcanzar la octava fila', () => {
      // Peón blanco en a7 a punto de coronar dando jaque al rey en a2
      const chess = new Chess('8/P7/8/8/8/8/k7/4K3 w - - 0 1');
      const promo = chess.move({ from: 'a7', to: 'a8', promotion: 'q' });

      expect(promo.san).toBe('a8=Q+');
      const newQueen = chess.get('a8');
      expect(newQueen).toEqual({ type: 'q', color: 'w' });
    });

    test('Prohibido mover dejando al propio rey en jaque (pieza clavada)', () => {
      // Torre blanca clavando caballo negro al rey negro
      // Torre en e1, Caballo negro en e7, Rey negro en e8
      const chess = new Chess('4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1');
      // El caballo en e7 no puede moverse porque expondría al rey a la torre
      expect(() => {
        chess.move({ from: 'e7', to: 'c6' });
      }).toThrow();
    });
  });
});
