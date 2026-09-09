'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Adaptador para el motor de ajedrez Stockfish mediante el protocolo UCI (Universal Chess Interface).
 * Se comunica con el proceso nativo mediante stdin/stdout.
 */
class StockfishAdapter {
  /**
   * @param {string} [executablePath] Ruta al binario de Stockfish.
   */
  constructor(executablePath) {
    this.executablePath =
      executablePath ||
      process.env.STOCKFISH_PATH ||
      path.resolve(__dirname, '../../bin/stockfish.exe');
  }

  /**
   * Parsea un token UCI (ej: "e2e4", "e7e8q") a un objeto { from, to, promotion }.
   * @param {string} uciMove
   * @returns {{ from: string, to: string, promotion?: string }}
   */
  static parseUciMove(uciMove) {
    if (!uciMove || uciMove.length < 4) {
      throw new Error(`Jugada UCI inválida: "${uciMove}"`);
    }

    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove.slice(4, 5).toLowerCase() : undefined;

    return { from, to, promotion };
  }

  /**
   * Calcula la mejor jugada para una posición dada en formato FEN.
   * @param {string} fen Posición actual en FEN.
   * @param {object} [options]
   * @param {number} [options.skillLevel=20] Nivel de habilidad (0-20).
   * @param {number} [options.searchDepth=10] Profundidad de búsqueda.
   * @param {number} [options.timeLimitMs=1000] Tiempo límite de cálculo en ms.
   * @returns {Promise<{ from: string, to: string, promotion?: string, raw: string }>}
   */
  async getBestMove(fen, { skillLevel = 20, searchDepth = 10, timeLimitMs = 1000 } = {}) {
    if (!fs.existsSync(this.executablePath)) {
      throw new Error(
        `Binario de Stockfish no encontrado en: ${this.executablePath}. Ejecuta "npm run setup:stockfish" para descargarlo.`,
      );
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      const child = spawn(this.executablePath);

      // Tiempo límite de seguridad (el tiempo solicitado + 2000ms de gracia)
      const timeoutTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          child.kill();
          reject(new Error(`Timeout esperando respuesta de Stockfish (${timeLimitMs + 2000}ms)`));
        }
      }, timeLimitMs + 2000);

      const cleanup = () => {
        clearTimeout(timeoutTimer);
        try {
          child.stdin.write('quit\n');
        } catch (_) {}
      };

      child.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutTimer);
          reject(new Error(`Error al invocar proceso de Stockfish: ${err.message}`));
        }
      });

      let stdoutBuffer = '';

      child.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');
        // Mantener la última línea incompleta en el buffer
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('bestmove')) {
            if (!resolved) {
              resolved = true;
              cleanup();

              const parts = trimmed.split(' ');
              const rawMove = parts[1];

              if (!rawMove || rawMove === '(none)') {
                reject(new Error('Stockfish no encontró jugadas legales posibles.'));
                return;
              }

              try {
                const parsed = StockfishAdapter.parseUciMove(rawMove);
                resolve({ ...parsed, raw: rawMove });
              } catch (parseErr) {
                reject(parseErr);
              }
            }
          }
        }
      });

      // Configurar y ordenar el cálculo a Stockfish
      const uciCommands = [
        'uci',
        'isready',
        `setoption name Skill Level value ${Math.max(0, Math.min(20, skillLevel))}`,
        `position fen ${fen}`,
        `go depth ${searchDepth} movetime ${timeLimitMs}`,
      ].join('\n') + '\n';

      child.stdin.write(uciCommands);
    });
  }
}

module.exports = { StockfishAdapter };
