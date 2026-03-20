# 🃏 Truc Valencià — Videojuego Online

Implementación web del juego de cartas **Truc Valencià** en tiempo real, construido como un monorepo Nx con TypeScript estricto en todo el stack.

---

## 🗺️ Arquitectura del Monorepo

```
valencia-truc/
├── apps/
│   ├── frontend/          # Cliente React + Tailwind CSS + Framer Motion
│   └── backend/           # Servidor Socket.io + XState (orquestador)
└── libs/
    └── shared/
        ├── game-engine/   # Lógica pura del Truc Valencià (single source of truth)
        └── interfaces/    # Contratos TypeScript compartidos (eventos Socket.io)
```

### Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Monorepo | Nx Workspace |
| Frontend | React 19, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Socket.io |
| Estado del Juego | XState v5 (máquinas de estados paralelas) |
| Lenguaje | TypeScript estricto (sin `any`) |
| Tests | Jest (unitarios), Cypress (E2E) |

---

## 🎴 Reglas del Truc Valencià (Implementadas)

- **Mazo de 22 cartas**: Se excluyen los 2s, 8s, 9s y todas las figuras (10, 11, 12).
- **Jerarquía no lineal** (de mayor a menor poder):
  1. 🗡️ As de Espadas
  2. 🪄 As de Bastos
  3. ⚡ 7 de Espadas
  4. 🏅 7 de Oros
  5. Treses, Cuatros, Cincos, Seis, 7 de Copas/Bastos, As de Oros/Copas
- **Cálculo de Envido**: Solo se puede cantar en la primera mano. Puntuación máxima: 33 pts.
- **Flujo de Truc**: `Truc → Retruc → Vale Quatre` con interrupciones de estado.

---

## 🚀 Comandos Disponibles

```bash
# Levantar frontend + backend en modo watch
npm run dev

# Build de producción de todos los proyectos
npm run build

# Lanzar todos los tests unitarios
npm run test

# Pasar el linter por todo el monorepo
npm run lint

# Ejecutar tests E2E (Cypress)
npm run e2e
```

### Comandos Nx individuales

```bash
# Servir solo el frontend (React, puerto 4200)
npx nx serve frontend

# Servir solo el backend (Socket.io, puerto 3333)
npx nx serve backend

# Build de producción de un proyecto concreto
npx nx build frontend
npx nx build backend

# Tests unitarios de la lógica compartida
npx nx test shared-game-engine

# Explorar el grafo de dependencias del monorepo
npx nx graph
```

---

## 🤖 Bot de Pruebas (IA)

El backend incluye un **TrucBot** con heurísticas simples para partidas de prueba:

- Canta **Envido** si supera los 27 puntos de envido.
- Canta **Truc** si tiene una de las 4 cartas maestras (o con un 20% de farol).
- Simula **tiempo de pensamiento** (1–3 segundos) para una experiencia realista.

**Endpoint de debug:**
```
GET http://localhost:3333/debug/start-bot-game
```
Esto inicializa una sala `room-1` con el bot en el Equipo 2. Abre `localhost:4200` y comienza a jugar directamente.

---

## 🛡️ Seguridad Anti-Trampas

El backend implementa `sanitizeGameState()`: antes de emitir el estado por socket, **oculta las cartas del rival**, enviando únicamente un contador de cartas en mano. Ningún usuario puede ver las cartas del oponente inspeccionando el tráfico de red.

---

## 🧪 Tests Unitarios

La lógica de dominio en `libs/shared/game-engine` está cubierta por tests Jest que validan:

- La jerarquía de poder de todas las cartas especiales.
- El cálculo correcto de Envido (mismos palos, palos distintos, máximo 33).
- La validación del mazo de 22 cartas (sin 2s, 8s, 9s ni figuras).

```bash
npx nx test shared-game-engine
```

---

## 📡 Contratos de Eventos (Socket.io)

Definidos en `libs/shared/interfaces/socket-events.ts`:

| Evento Cliente → Servidor | Descripción |
|---|---|
| `room:join` | El jugador se une a una sala |
| `game:action` | Envía una acción (`TRUC`, `ENVIDO`, `JUGAR_CARTA`, etc.) |

| Evento Servidor → Cliente | Descripción |
|---|---|
| `game:state-update` | Estado sanitizado del juego para ese jugador |
| `game:error` | Mensaje de error (sala no encontrada, etc.) |

---

## 📁 Archivos Clave

| Archivo | Descripción |
|---|---|
| `libs/shared/game-engine/src/lib/shared-game-engine.ts` | Lógica pura: mazo, jerarquía, envido |
| `libs/shared/game-engine/src/lib/truc-machine.ts` | Máquina de estados XState |
| `libs/shared/interfaces/src/lib/socket-events.ts` | Contratos de eventos y tipos |
| `apps/backend/src/main.ts` | Gateway Socket.io + gestión de salas |
| `apps/backend/src/app/sanitize-state.ts` | Función anti-trampas |
| `apps/backend/src/app/bot.ts` | IA Bot de pruebas |
| `apps/frontend/src/app/hooks/useTrucSocket.ts` | Hook React para la conexión |
| `apps/frontend/src/app/components/Board.tsx` | Tablero principal de juego |
| `apps/frontend/src/app/components/Card.tsx` | Carta con CSS Sprites + Framer Motion |
