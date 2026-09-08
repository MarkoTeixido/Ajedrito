import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Tipo base para errores controlados de la aplicación
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Middleware centralizado de manejo de errores para Express.
 * Debe registrarse DESPUÉS de todas las rutas.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Error controlado de la aplicación
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Error de validación de Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Error genérico — loguear y responder 500
  console.error('[ErrorHandler]', err);
  res.status(500).json({
    error: 'Error interno del servidor',
  });
}
