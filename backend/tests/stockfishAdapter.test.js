'use strict';

const { StockfishAdapter } = require('../src/adapters/StockfishAdapter');
const path = require('path');
const fs = require('fs');

describe('StockfishAdapter (UCI Protocol)', () => {
  describe('parseUciMove', () => {
    test('parsea jugadas estándar de 4 caracteres', () => {
      const parsed = StockfishAdapter.parseUciMove('e2e4');
      expect(parsed).toEqual({
        from: 'e2',
        to: 'e4',
        promotion: undefined,
      });
    });

    test('parsea jugadas de coronación/promoción de 5 caracteres', () => {
      const parsed = StockfishAdapter.parseUciMove('e7e8q');
      expect(parsed).toEqual({
        from: 'e7',
        to: 'e8',
        promotion: 'q',
      });
    });

    test('arroja error ante tokens vacíos o incompletos', () => {
      expect(() => StockfishAdapter.parseUciMove('e2')).toThrow(/Jugada UCI inválida/);
      expect(() => StockfishAdapter.parseUciMove('')).toThrow(/Jugada UCI inválida/);
      expect(() => StockfishAdapter.parseUciMove(null)).toThrow(/Jugada UCI inválida/);
    });
  });

  describe('getBestMove con binario real de Stockfish', () => {
    const binPath = path.resolve(__dirname, '../bin/stockfish.exe');

    // Solo corre la prueba de integración con el subproceso si el binario está instalado
    const runLiveTest = fs.existsSync(binPath) ? test : test.skip;

    runLiveTest('calcula una jugada legal para la posición inicial', async () => {
      const adapter = new StockfishAdapter(binPath);
      const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      const move = await adapter.getBestMove(initialFen, {
        skillLevel: 1,
        searchDepth: 2,
        timeLimitMs: 300,
      });

      expect(move).toBeDefined();
      expect(move.from).toMatch(/^[a-h][1-8]$/);
      expect(move.to).toMatch(/^[a-h][1-8]$/);
      expect(move.raw).toBeDefined();
    }, 10000);

    test('arroja error explícito si la ruta al binario no existe', async () => {
      const adapter = new StockfishAdapter('ruta/inexistente/stockfish.exe');
      await expect(
        adapter.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      ).rejects.toThrow(/Binario de Stockfish no encontrado/);
    });
  });
});
