'use strict';

require('dotenv').config();
const { Chess } = require('chess.js');
const { sequelize } = require('../config/database');
const { Game, Move, GameMode, PlayerType, GameResult, GameSource } = require('../db/models/index');
const { INITIAL_FEN } = require('../constants/chess');

/**
 * Colección curada de partidas magistrales y líneas de apertura variadas
 * para resolver el problema de arranque en frío (Cold Start) de la IA.
 * Todas las partidas se etiquetan con source = 'SEED'.
 *
 * Estas partidas proveen al modelo de IA datos de entrenamiento de calidad
 * antes de que los usuarios comiencen a jugar partidas reales.
 */
const SEED_GAMES = [
  {
    title:  'Paul Morphy vs Duke of Brunswick & Count Isouard (Opera Game, 1858)',
    result: GameResult.WHITE_WINS,
    moves:  [
      'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5',
      'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5',
      'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6',
      'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#',
    ],
  },
  {
    title:  'Apertura Ruy Lopez (Variante Cerrada Clásica)',
    result: GameResult.WHITE_WINS,
    moves:  [
      'e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7',
      'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8', 'd4', 'Nbd7',
      'Nbd2', 'Bb7', 'Bc2', 'Re8', 'Nf1', 'Bf8', 'Ng3', 'g6', 'a4', 'c5',
      'd5', 'c4', 'Bg5', 'h6', 'Be3', 'Nc5', 'Qd2', 'h5', 'Bg5', 'Be7',
    ],
  },
  {
    title:  'Defensa Siciliana (Variante Najdorf)',
    result: GameResult.BLACK_WINS,
    moves:  [
      'e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6',
      'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'h5', 'Qd2', 'Nbd7', 'O-O-O', 'Be7',
      'Kb1', 'Rc8', 'Nd5', 'Bxd5', 'exd5', 'Nb6', 'Bxb6', 'Qxb6', 'Bd3', 'Nxd5',
      'Bf5', 'Ne3', 'Bxc8', 'Nxd1', 'Rxd1', 'O-O', 'Bf5', 'g6', 'Be4', 'Kg7',
    ],
  },
  {
    title:  'Gambito de Dama Declinado (Línea Tartakower)',
    result: GameResult.DRAW,
    moves:  [
      'd4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'h6',
      'Bh4', 'O-O', 'Nf3', 'b6', 'Rc1', 'Bb7', 'Bxf6', 'Bxf6', 'cxd5', 'exd5',
      'b4', 'c6', 'Be2', 'Qd6', 'Qb3', 'Nd7', 'O-O', 'Rfe8', 'Rfd1', 'a5',
      'a3', 'axb4', 'axb4', 'b5', 'Ne1', 'Nb6', 'Nd3', 'Nc4', 'Nc5', 'Bc8',
    ],
  },
  {
    title:  'Defensa Francesa (Variante Winawer)',
    result: GameResult.WHITE_WINS,
    moves:  [
      'e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4', 'e5', 'c5', 'a3', 'Bxc3+',
      'bxc3', 'Ne7', 'Qg4', 'O-O', 'Bd3', 'Nbc6', 'Qh5', 'Ng6', 'Nf3', 'Qc7',
      'Be3', 'c4', 'Bxg6', 'fxg6', 'Qg4', 'Qf7', 'h4', 'Qf5', 'Qxf5', 'gxf5',
      'h5', 'Bd7', 'Bf4', 'h6', 'Kd2', 'b5', 'Nh4', 'Rfb8', 'f3', 'a5',
    ],
  },
  {
    title:  'Defensa Caro-Kann (Variante Clásica)',
    result: GameResult.DRAW,
    moves:  [
      'e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6',
      'h4', 'h6', 'Nf3', 'Nd7', 'h5', 'Bh7', 'Bd3', 'Bxd3', 'Qxd3', 'e6',
      'Bd2', 'Ngf6', 'O-O-O', 'Be7', 'Kb1', 'O-O', 'Ne4', 'Nxe4', 'Qxe4', 'Nf6',
      'Qe2', 'Qd5', 'Ne5', 'Qe4', 'Qxe4', 'Nxe4', 'Be1', 'Rfd8', 'f3', 'Nf6',
    ],
  },
  {
    title:  'Defensa India de Rey (Ataque Mar del Plata)',
    result: GameResult.BLACK_WINS,
    moves:  [
      'd4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O',
      'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7', 'Ne1', 'Nd7', 'Be3', 'f5',
      'f3', 'f4', 'Bf2', 'g5', 'Nd3', 'Nf6', 'c5', 'Ng6', 'Rc1', 'Rf7',
      'Kh1', 'h5', 'cxd6', 'cxd6', 'Nb5', 'a6', 'Na3', 'b5', 'Rc6', 'g4',
    ],
  },
  {
    title:  'Apertura Italiana (Giuoco Piano Moderno)',
    result: GameResult.WHITE_WINS,
    moves:  [
      'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6',
      'O-O', 'a6', 'Bb3', 'Ba7', 'Nbd2', 'O-O', 'h3', 'h6', 'Re1', 'Re8',
      'Nf1', 'Be6', 'Bc2', 'd5', 'exd5', 'Bxd5', 'Ng3', 'Qd7', 'Nh4', 'Be6',
      'Qf3', 'Bd5', 'Qe2', 'Rad8', 'Nhf5', 'Be6', 'Qf3', 'Bd5', 'Ne4', 'Nxe4',
    ],
  },
];

/**
 * Inserta las partidas de seed en la base de datos.
 *
 * La operación es idempotente: si ya existen partidas con source='SEED',
 * el script no vuelve a insertarlas.
 *
 * Toda la inserción ocurre dentro de una transacción Sequelize para garantizar
 * atomicidad: si una jugada falla, se revierte la partida entera.
 */
async function seedGames() {
  console.log('🌱 Iniciando carga de partidas maestras (Cold Start)...');
  await sequelize.authenticate();

  // Verificar idempotencia: si ya hay seeds, no volver a insertar
  const existingCount = await Game.count({ where: { source: GameSource.SEED } });
  if (existingCount > 0) {
    console.log(`ℹ️  Ya existen ${existingCount} partidas de seed en la base de datos. Omitiendo.`);
    return;
  }

  let totalMovesPersisted = 0;
  let gamesCreated = 0;

  // Transacción única para garantizar atomicidad de todo el seed
  await sequelize.transaction(async (transaction) => {
    for (const gameData of SEED_GAMES) {
      const chess = new Chess();

      const game = await Game.create(
        {
          mode:                GameMode.PVP,
          whiteType:           PlayerType.HUMAN,
          blackType:           PlayerType.HUMAN,
          difficultyProfileId: null,
          result:              gameData.result,
          source:              GameSource.SEED,
          currentFen:          INITIAL_FEN,
          startedAt:           new Date(),
          endedAt:             new Date(),
        },
        { transaction },
      );

      gamesCreated++;

      for (let i = 0; i < gameData.moves.length; i++) {
        const san        = gameData.moves[i];
        const fenBefore  = chess.fen();
        const moveResult = chess.move(san);

        if (!moveResult) {
          console.warn(`[Seed] Jugada inválida "${san}" en partida "${gameData.title}". Saltando partida.`);
          break;
        }

        const fenAfter   = chess.fen();
        const moveColor  = moveResult.color === 'w' ? 'white' : 'black';

        await Move.create(
          {
            gameId:      game.id,
            moveNumber:  i + 1,
            color:       moveColor,
            san:         moveResult.san,
            fenBefore,
            fenAfter,
            timeSpentMs: 500,
            createdAt:   new Date(Date.now() + i * 1000),
          },
          { transaction },
        );

        totalMovesPersisted++;
      }

      // Actualizar el FEN final de la partida al estado resultante de todas las jugadas
      await game.update({ currentFen: chess.fen() }, { transaction });
      console.log(`  ✓ Partida insertada: "${gameData.title}" (${gameData.moves.length} jugadas)`);
    }
  });

  console.log('\n✅ Seeding completado con éxito:');
  console.log(`   - Partidas creadas (source='SEED'): ${gamesCreated}`);
  console.log(`   - Jugadas persistidas: ${totalMovesPersisted}`);
}

seedGames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error durante el seeding:', err);
    process.exit(1);
  });


/**
 * Colección curada de partidas magistrales y líneas de apertura variadas
 * para resolver el problema de arranque en frío (Cold Start) de la IA.
 * Todas las partidas se etiquetan con source = 'SEED'.
 */
const SEED_GAMES = [
