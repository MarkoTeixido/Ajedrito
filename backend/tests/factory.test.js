'use strict';

const { GameSessionFactory } = require('../src/factories/GameSessionFactory');
const { GameMode } = require('../src/db/models/Game');
const { HumanOpponent } = require('../src/strategies/HumanOpponent');

// Mock GameRepository
jest.mock('../src/repositories/GameRepository', () => {
  return {
    GameRepository: jest.fn().mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({
        id: 'test-game-123',
        mode: 'PVP',
        whiteType: 'HUMAN',
        blackType: 'HUMAN',
      }),
    })),
  };
});

describe('GameSessionFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new GameSessionFactory();
  });

  test('creates a PVP session with HumanOpponent strategy', async () => {
    const session = await factory.create({ mode: GameMode.PVP });

    expect(session).toBeDefined();
    expect(session.gameId).toBe('test-game-123');
    expect(session.opponentStrategy).toBeInstanceOf(HumanOpponent);
  });

  test('throws error for unsupported or unknown game modes', async () => {
    await expect(factory.create({ mode: 'NON_EXISTENT' })).rejects.toThrow(
      /Modo de juego desconocido/,
    );
  });
});
