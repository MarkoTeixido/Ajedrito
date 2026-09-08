'use strict';

/**
 * Clase de error controlado de la aplicación.
 * Cualquier lanzamiento de AppError se convierte en respuesta HTTP con código específico.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Middleware centralizado de manejo de errores para Express.
 * Registrar DESPUÉS de todas las rutas.
 * @param {unknown} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error genérico — loguear y devolver 500
  console.error('[ErrorHandler]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { AppError, errorHandler };
