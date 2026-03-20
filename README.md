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
| Frontend | React 19, Tailwind CSS 3, Framer Motion |
| Backend | Node.js, Express, Socket.io |
| Estado del Juego | XState v5 (máquinas de estados paralelas) |
| Lenguaje | TypeScript estricto (sin `any`) |
| Tests | Jest (unitarios), Cypress (E2E) |

---

## 🖥️ Rutas del Frontend

| Ruta | Descripción |
|---|---|
| `/` | **Lobby** — lista en tiempo real de salas activas |
| `/partida/:uid` | **Partida** — tablero de juego identificado por UUID |

### Flujo de Usuario

1. Abre `localhost:4200` → ves el lobby con las salas abiertas (actualizadas vía Socket.io).
2. **"+ Crear Sala"** → modal con nombre de sala y selector de bots (0–3).
3. Al crear/unirte → navegas automáticamente a `/partida/<uuid>`.
4. El `UID` y `playerId` se guardan en **LocalStorage** para recuperar la partida en un refresco de página.

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
npm run dev      # o npm start

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

# Tests unitarios de la lógica compartida
npx nx test shared-game-engine

# Explorar el grafo de dependencias del monorepo
npx nx graph
```

---

## 🏠 Sistema de Salas (Multi-Room)

- El backend gestiona **N salas** simultáneas, cada una identificada por un **UUID** único.
- Nombre por defecto: `Sala X` donde `X = salas activas + 1`.
- Máximo **4 jugadores** por sala (humanos + bots).
- Al crear una sala se pueden añadir **0–3 bots** como contrincantes.
- Cuando todos los humanos se desconectan, la sala se **destruye automáticamente** y la memoria se libera.
- La lista de salas se actualiza en **tiempo real** para todos los clientes en el lobby.

### Endpoint REST (debug)
```
GET http://localhost:3333/api/rooms
```

---

## 📡 Contratos de Eventos (Socket.io)

Definidos en `libs/shared/interfaces/src/lib/socket-events.ts`:

| Evento Cliente → Servidor | Payload | Descripción |
|---|---|---|
| `room:create` | `{ name?, bots? }` | Crear sala nueva |
| `room:join` | `{ uid, playerId }` | Unirse a sala existente |
| `game:action` | `{ type, payload? }` | Enviar acción de juego |

| Evento Servidor → Cliente | Payload | Descripción |
|---|---|---|
| `rooms:list` | `RoomSummary[]` | Lista actualizada de salas (broadcast) |
| `room:created` | `RoomSummary` | Confirmación de creación |
| `room:joined` | `RoomSummary` | Confirmación de unión |
| `room:error` | `string` | Sala llena, no existe, etc. |
| `room:destroyed` | `string` | Sala eliminada al finalizar la partida |
| `game:state-update` | `GameStateUpdate` | Estado sanitizado para ese jugador |

---

## 🤖 Bot de Pruebas (IA)

El backend incluye un **TrucBot** con heurísticas simples:

- Canta **Envido** si supera los 27 puntos de envido.
- Canta **Truc** si tiene una de las 4 cartas maestras (o con un 20% de farol).
- Simula **tiempo de pensamiento** (1–3 segundos) para una experiencia realista.

Se instancian directamente al crear la sala, sin necesidad de websockets.

---

## 🛡️ Seguridad Anti-Trampas

`sanitizeGameState()` en el backend intercepta el estado XState antes de emitirlo por socket. Cada jugador recibe solo sus propias cartas; las del rival se sustituyen por un simple contador.

---

## 🧪 Tests Unitarios

```bash
npx nx test shared-game-engine
```

Validan:
- Jerarquía de poder de todas las cartas especiales.
- Cálculo correcto de Envido (mismos palos / palos distintos / máximo 33).
- Validación del mazo de 22 cartas.

---

## 📁 Archivos Clave

| Archivo | Descripción |
|---|---|
| `libs/shared/game-engine/src/lib/shared-game-engine.ts` | Lógica pura: mazo, jerarquía, envido |
| `libs/shared/game-engine/src/lib/truc-machine.ts` | Máquina de estados XState + reparto de cartas |
| `libs/shared/interfaces/src/lib/socket-events.ts` | Todos los contratos de eventos y tipos |
| `apps/backend/src/main.ts` | Gateway Socket.io + gestión de salas multi-room |
| `apps/backend/src/app/sanitize-state.ts` | Función anti-trampas |
| `apps/backend/src/app/bot.ts` | IA Bot de pruebas |
| `apps/frontend/src/app/pages/Home.tsx` | Lobby en tiempo real |
| `apps/frontend/src/app/pages/GamePage.tsx` | Cargador de partida desde URL + LocalStorage |
| `apps/frontend/src/app/hooks/useTrucSocket.ts` | Hook React para la conexión a la sala |
| `apps/frontend/src/app/components/Board.tsx` | Tablero principal de juego |
| `apps/frontend/src/app/components/Card.tsx` | Carta con CSS Sprites + Framer Motion |
