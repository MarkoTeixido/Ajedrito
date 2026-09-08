import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Esquema de validación: el proceso falla rápido si falta una variable crítica
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL de PostgreSQL válida'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
