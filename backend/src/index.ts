import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { env } from '@/config/env';
import { sequelize } from '@/config/database';
import { errorHandler } from '@/middleware/errorHandler';

// Importar modelos para registrar asociaciones
import '@/db/models/index';

// Rutas
import healthRouter from '@/routes/health';

// ── Express + HTTP server ────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

// ── Middlewares globales ─────────────────────────────────────────────────────

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);

// ── Manejo de errores (debe ir al final) ────────────────────────────────────

app.use(errorHandler);

// ── Arranque ─────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.PORT}`);
    console.log(`   Entorno: ${env.NODE_ENV}`);
  });
}

bootstrap();

export { io };
