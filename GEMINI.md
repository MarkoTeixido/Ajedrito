# Ajedrito App — Contexto del proyecto

## Qué es esto

Trabajo práctico de la materia Modelos y Simulación. Sistema de ajedrez (Ajedrito) **web pero local**:
se juega en un solo dispositivo, sin login ni cuentas de usuario, sin multijugador
online entre dispositivos distintos. Es un requisito explícito del profesor, no
una limitación técnica — no lo cuestiones ni lo "arregles".

## Modos de juego (los tres son obligatorios)

1. **Jugador vs Jugador (hotseat)**: dos personas turnándose en el mismo dispositivo.
2. **Jugador vs Stockfish**: motor de ajedrez ya existente, integrado como proceso
   externo por protocolo **UCI**. NO se reprograma ni se reentrena. La dificultad
   se controla con parámetros nativos del motor (Skill Level, profundidad, tiempo).
3. **Jugador vs IA propia**: modelo entrenado por nosotros con las partidas que se
   van guardando en la base de datos. Es un servicio Python separado (`ai-service`).
   El entrenamiento es un job **batch**, no en tiempo real dentro de una partida.

## Restricciones no negociables (pedidas explícitamente por el profesor)

- Sin login / sin autenticación / sin sesiones de usuario persistentes.
- Sin ELO real del jugador — la dificultad es un selector de niveles preconfigurados
  (Principiante/Intermedio/Avanzado/Experto), no una medición del nivel de la persona.
- **Guardar movimiento a movimiento, no partida completa al final.** Cada jugada se
  persiste en la base apenas se realiza (tanto la del jugador como la del rival).
  Esto es crítico por dos razones: (1) si se corta la conexión o se cierra el
  navegador a mitad de partida, no se pierde el historial jugado hasta ese punto,
  y (2) el dataset para entrenar la IA propia se arma a partir de jugadas
  individuales, no de partidas cerradas — así hay más datos disponibles más rápido,
  sin depender de que cada partida llegue a jaque mate.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript (opcional, solo si es necesario) + TailwindCSS, `react-chessboard`,
  `chess.js`. (shadcn/ui es opcional, se suma más adelante si hace falta — no es
  una decisión de arquitectura, es una librería de componentes.)
- **Backend**: Node.js + Express + TypeScript + Sequelize como ORM. Socket.io para
  la jugada del rival (Stockfish / IA propia), que no es instantánea.
- **Base de datos**: Supabase (Postgres administrado). Sequelize se conecta
  directo con el connection string de Supabase (dialecto `postgres`), sin usar
  el cliente JS de Supabase — es simplemente el Postgres de siempre.
- **ai-service**: Python + FastAPI + scikit-learn/numpy. Lee la misma base de
  datos (Supabase) para construir el dataset de entrenamiento — solo lectura,
  nunca escribe partidas.
- **Stockfish**: binario invocado por protocolo UCI desde el backend
  (subproceso, sin contenedor propio por ahora).

## Sin Docker por ahora

El proyecto arranca con las 3 carpetas (`frontend/`, `backend/`, `ai-service/`)
corriendo cada una en local con su propio comando (`npm run dev`, `uvicorn`).
Docker Compose se agrega recién al final si el tiempo lo permite — no lo
propongas como parte de las primeras iteraciones.

## Arquitectura y patrones ya decididos (no los cambies sin razón fuerte)

- **Strategy**: `OpponentStrategy` (interfaz) con `HumanOpponent` /
  `StockfishOpponent` / `CustomAIOpponent`. `GameSession` no sabe contra quién
  juega, solo le pide "la próxima jugada" a la estrategia activa.
- **Adapter**: `StockfishAdapter` (habla UCI con el binario), `AIServiceAdapter`
  (habla HTTP con `ai-service`).
- **Repository**: `GameRepository` / `MoveRepository` encapsulan Sequelize.
- **Factory**: `GameSessionFactory` arma la `GameSession` correcta según el modo
  elegido (PVP / PV_STOCKFISH / PV_AI).

## Modelo de datos (a crear con Sequelize)

- `Game`: id, mode, whiteType, blackType, difficultyProfileId (FK, nullable),
  result, startedAt, endedAt.
- `Move`: id, gameId (FK), moveNumber, color, san, fenBefore, fenAfter,
  evalScore (nullable), timeSpentMs, createdAt. **Se inserta apenas ocurre
  cada jugada, no al final de la partida.**
- `DifficultyProfile`: id, name, engineType, skillLevel, searchDepth, timeLimitMs.
- `AIModelVersion`: id, trainedAt, datasetSize, metrics (json), filePath.

## Convenciones de trabajo

- TypeScript en modo `strict` en frontend y backend, sin `any` salvo
  justificación en comentario.
- Cada entrada de usuario (jugada, modo, dificultad) se valida — jugada ilegal,
  modo inexistente, FEN corrupto, etc. deben devolver error controlado (con
  middleware de manejo de errores en Express), no romper el proceso.
- Toda funcionalidad nueva no trivial se acompaña de al menos una prueba
  unitaria (Jest en frontend/backend, Pytest en ai-service).
- Nombrar las cosas en inglés en el código (clases, variables, archivos);
  comentarios y mensajes de commit pueden ir en español.
- No agregues autenticación, cuentas de usuario, ni multijugador online bajo
  ninguna circunstancia, aunque parezca "una mejora natural".