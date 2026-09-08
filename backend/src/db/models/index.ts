/**
 * Punto de entrada de los modelos Sequelize.
 * Importar desde aquí en lugar de desde los archivos individuales
 * para garantizar que todos los modelos estén inicializados antes de usarse.
 */
import { Game } from './Game';
import { Move } from './Move';
import { DifficultyProfile } from './DifficultyProfile';
import { AIModelVersion } from './AIModelVersion';

// ── Asociaciones ─────────────────────────────────────────────────────────────

// Una partida tiene muchas jugadas
Game.hasMany(Move, { foreignKey: 'gameId', as: 'moves', onDelete: 'CASCADE' });
Move.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

// Una partida puede tener un perfil de dificultad
Game.belongsTo(DifficultyProfile, { foreignKey: 'difficultyProfileId', as: 'difficultyProfile' });
DifficultyProfile.hasMany(Game, { foreignKey: 'difficultyProfileId', as: 'games' });

export { Game, Move, DifficultyProfile, AIModelVersion };
