'use strict';

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

const { env } = require('./config/env');
const { sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Inicializar modelos y registrar asociaciones
require('./db/models/index');

// Rutas
const healthRouter = require('./routes/health');

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

bootstrap();

module.exports = { io };
