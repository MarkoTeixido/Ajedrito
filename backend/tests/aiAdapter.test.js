'use strict';

const { AIServiceAdapter } = require('../src/adapters/AIServiceAdapter');
const { CustomAIOpponent } = require('../src/strategies/CustomAIOpponent');

describe('AIServiceAdapter & CustomAIOpponent', () => {
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AIServiceAdapter', () => {
    test('obtiene la jugada predicha exitosamente', async () => {
      const mockResponse = {
        san: 'e5',
        uci: 'e7e5',
        from: 'e7',
        to: 'e5',
        promotion: null,
        confidence: 0.85,
        method: 'ml',
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const adapter = new AIServiceAdapter('http://localhost:8000');
      const result = await adapter.predictMove(initialFen, 'game-123');

      expect(result).toEqual({
        from: 'e7',
        to: 'e5',
        promotion: undefined,
        san: 'e5',
        confidence: 0.85,
        method: 'ml',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/predict',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen: initialFen, game_id: 'game-123' }),
        }),
      );
    });

    test('maneja errores HTTP del microservicio', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Error interno en inferencia' }),
      });

      const adapter = new AIServiceAdapter('http://localhost:8000');
      await expect(adapter.predictMove(initialFen)).rejects.toThrow(
        /Error interno en inferencia/,
      );
    });
  });

  describe('CustomAIOpponent', () => {
    test('delega la predicción a AIServiceAdapter', async () => {
      const mockAdapter = {
        predictMove: jest.fn().mockResolvedValue({
          from: 'e7',
          to: 'e5',
          san: 'e5',
          confidence: 0.9,
          method: 'ml',
        }),
      };

      const opponent = new CustomAIOpponent(mockAdapter);
      const move = await opponent.getNextMove(initialFen, 'game-456');

      expect(move.from).toBe('e7');
      expect(move.to).toBe('e5');
      expect(mockAdapter.predictMove).toHaveBeenCalledWith(initialFen, 'game-456');
    });
  });
});
