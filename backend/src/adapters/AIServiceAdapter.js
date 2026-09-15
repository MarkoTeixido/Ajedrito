'use strict';

const { env } = require('../config/env');

/**
 * Adaptador para el microservicio de IA propia en Python (FastAPI).
 * Se comunica vía HTTP (REST) con el endpoint /predict.
 */
class AIServiceAdapter {
  /**
   * @param {string} [baseUrl] URL base del servicio de IA.
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl || env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Solicita la próxima jugada predicha para la posición FEN dada.
   * @param {string} fen
   * @param {string} [gameId]
   * @param {number} [timeoutMs=5000]
   * @returns {Promise<{ from: string, to: string, promotion?: string, san: string, confidence: number, method: string }>}
   */
  async predictMove(fen, gameId, timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, game_id: gameId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Error en servicio de IA' }));
        throw new Error(errData.detail || `Error HTTP ${response.status} del servicio de IA`);
      }

      const data = await response.json();
      return {
        from: data.from,
        to: data.to,
        promotion: data.promotion || undefined,
        san: data.san,
        confidence: data.confidence ?? 0.5,
        method: data.method ?? 'ml',
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Timeout esperando respuesta del servicio de IA (${timeoutMs}ms)`);
      }
      throw new Error(`Fallo al comunicarse con ai-service en ${this.baseUrl}: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { AIServiceAdapter };
