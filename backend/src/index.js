'use strict';

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

const { env } = require('./config/env');
const { sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Inicializar modelos y registrar asociaciones antes de cualquier uso
require('./db/models/index');

// Rutas
const healthRouter             = require('./routes/health');
const gamesRouter              = require('./routes/games');
const movesRouter              = require('./routes/moves');
const difficultyProfilesRouter = require('./routes/difficultyProfiles');

// ── Express + HTTP server ────────────────────────────────────────────────────

const app        = express();
const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin:  env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    console.log(`[Socket.io] Socket ${socket.id} se unió a la sala ${gameId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

// Exponer io para que los routers puedan emitir eventos
app.set('io', io);

// ── Middlewares globales ─────────────────────────────────────────────────────

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Logger HTTP — solo en desarrollo para no contaminar los logs de producción
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rutas ────────────────────────────────────────────────────────────────────

app.use('/health',                  healthRouter);
app.use('/api/games',               gamesRouter);
app.use('/api/games/:id/moves',     movesRouter);
app.use('/api/difficulty-profiles', difficultyProfilesRouter);

// ── Manejo de errores (debe ir después de todas las rutas) ───────────────────

app.use(errorHandler);

// ── Arranque ─────────────────────────────────────────────────────────────────

async function bootstrap() {
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

// ── Graceful shutdown ────────────────────────────────────────────────────────
// Cierra el servidor ordenadamente al recibir señales del sistema operativo.
// Esto garantiza que las conexiones activas terminen antes de salir.

function shutdown(signal) {
  console.log(`\n[Server] Señal ${signal} recibida. Cerrando servidor...`);
  httpServer.close(async () => {
    try {
      await sequelize.close();
      console.log('[Server] Conexión a la base de datos cerrada.');
    } catch (err) {
      console.error('[Server] Error cerrando la DB:', err);
    }
    console.log('[Server] Servidor apagado correctamente.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

bootstrap();

module.exports = { io };


