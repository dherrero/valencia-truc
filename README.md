# Truc Valencià — Videojuego Online (WIP)

> ¡IMPORTANTE!
> Este es un proyecto en desarrollo, por lo que muchas funcionalidades están incompletas o no están implementadas.

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

| Capa             | Tecnología                                |
| ---------------- | ----------------------------------------- |
| Monorepo         | Nx Workspace                              |
| Frontend         | React 19, Tailwind CSS 3, Framer Motion   |
| Backend          | Node.js, Express, Socket.io               |
| Estado del Juego | XState v5 (máquinas de estados paralelas) |
| Lenguaje         | TypeScript estricto (sin `any`)           |
| Tests            | Jest (unitarios), Cypress (E2E)           |

---

## 🖥️ Rutas del Frontend

| Ruta            | Descripción                                          |
| --------------- | ---------------------------------------------------- |
| `/`             | **Lobby** — lista en tiempo real de salas activas    |
| `/partida/:uid` | **Partida** — tablero de juego identificado por UUID |

### Flujo de Usuario

1. Abre `localhost:4200` → ves el lobby con las salas abiertas (actualizadas vía Socket.io).
2. **"+ Crear Sala"** → modal con nombre de sala y selector de bots (0–3).
3. Al crear/unirte → navegas automáticamente a `/partida/<uuid>`.
4. El `UID` y `playerId` se guardan en **LocalStorage** para recuperar la partida en un refresco de página.

---

## 🎴 Reglas del Truc Valencià (Implementadas)

- **Mazo de 22 cartas**: Se excluyen los 2s, 8s, 9s y todas las figuras: 10 (sota), 11 (caballo), 12 (rey).
- Se reparten 3 cartas a cada jugador.
- Se juega por parejas alternadas o enfrentadas.
- El objetivo del juego es ganar un número determinado de camas (1, 2 ó 3 camas). Cada cama se puede jugar a 18 ó 24 piedras; la primera mitad de las piedras se le llama popularmente “malas”, y a la segunda “buenas”. En este juego se juega a 24 piedras.
- **Jerarquía no lineal** (de mayor a menor poder):
  1. 🗡️ As de espadas (también llamado “la mayor”)
  2. 🪄 As de bastos
  3. ⚡ Siete de espadas (manilla de espadas)
  4. 🏅 Siete de oros (manilla de oros)
  5. Treses
  6. Siete de copas y siete de bastos (llamados “sietes falsos” o “malos”)
  7. Seises
  8. Cincos
  9. Cuatros

## Cómo jugar al “truc”

Al principio de la partida se decide por sorteo automático el jugador que es mano, es decir, el que empieza a jugar. En la siguiente ronda (si la hay) empezaría el jugador situado a la derecha del actual.

En cada ronda, se reparten 3 cartas a cada jugador y todos tiran una carta por turnos. El jugador con la carta de mayor valor ganará dicha mano y tirará primero en la siguiente (en caso de empate el jugador anterior será el primero en tirar). La primera pareja que gana 2 manos, gana la ronda.

Por ejemplo, si una pareja gana la primera mano y empata la segunda, gana la ronda.

Casos especiales:

- Si se empata la primera mano cada jugador debe tirar 2 cartas a la vez, una descubierta y otra oculta debajo. En caso de nuevo empate, se mostrarán las cartas ocultas. La carta descubierta debe ser de mayor valor que la oculta, de lo contrario ésta perderá su valor.
- Si se gana una mano, se pierde otra y se empata la 3ª, gana la pareja que ha ganado la primera mano.
- Si se empatan las 3 manos seguidas, ganará la ronda el jugador mano.

### El truco

El truco es una apuesta que se puede realizar en cualquier momento de la partida y la cobra el ganador de la ronda.

La pareja contraria debe responder con una de las siguientes opciones:

- _No quiero_. Rechaza el truco y la pareja contraria gana la ronda.
- _Quiero_. Acepta la apuesta la cual se resolverá al final de la ronda.
- _Retruco_, _Vale cuatro_, _Juego fuera_. Sube la apuesta y pasa el turno a la pareja contraria para que decida.

| Apuesta           | Piedras                         |
| ----------------- | ------------------------------- |
| Si no hay apuesta | 1 piedra al ganador de la ronda |
| Truco             | 2 piedras                       |
| Retruco           | 3 piedras                       |
| Vale cuatro       | 4 piedras                       |
| Juego fuera       | Gana la partida                 |

### El envido

Esta apuesta la gana el jugador que consigue ligar 2 cartas del mismo palo cuya suma sea la más alta. En este caso, los sietes son las cartas de mayor valor, y los ases las más bajas. Además, sólo se puede realizar en la primera mano y siempre antes del truco.

- Si se tienen 2 cartas del mismo palo, se suma su valor + 20 (de ahí la importancia de ligar dos cartas del mismo palo). La puntuación más alta del envido es 33 (7+6+20=33).
- Si nadie tiene 2 cartas del mismo palo, se cuenta la carta más alta.
- En caso de empate, gana el jugador que va de mano.
- Ejemplo: un 7 de copas pierde contra un 3 y un 1 de espadas (3+1+20=24 de envido)

En el envido es importante saber si se está en “buenas” o “malas”. En “buenas” al menos una de las parejas ya tiene la mitad de piedras. En “malas” todavía nadie ha llegado a la mitad.

La pareja contraria debe responder con una de las siguientes opciones:

- _No quiero_. Rechaza la apuesta y la pareja que ha envidado suma una piedra inmediatamente.
- _Quiero_. Acepta la apuesta que se resolverá al final de la ronda.
- _Vuelvo_. Dobla la apuesta y pasa el turno a la pareja contraria para que decida.
- _Falta_. Es la apuesta máxima del envido y depende del estado de la partida:
  - Si se está en “malas”, la pareja ganadora del envite se lleva toda la cama.
  - Si se está en “buenas”, la pareja ganadora se lleva las piedras que le faltan a la pareja con más puntos para conseguir la cama.

Ejemplo (partida a 24 piedras): una pareja tiene 10 piedras y la otra 15; en la falta se apostarían 9 piedras por estar en “buenas” (24-15=9).

El envido se juega antes que el truco, por tanto, si una pareja llega a los puntos de una cama sumando las piedras del envido, gana la cama y el truco no se tiene en cuenta.

Ejemplo (partida a 24 piedras): una pareja tiene 22 piedras y la otra 21; la primera gana un envido de 2 piedras y la segunda gana un truco de 4 piedras; gana la primera pareja con el envido.

Jugar las cartas tapadas
Tirar una carta tapada puede resultar útil para engañar a los contrarios y esconder tu jugada. Aunque si lo haces en la primera mano deberás tirar el resto de tus cartas tapadas.

¡Atención! Si tiras una carta tapada, esa carta se anula y no se contará para el envido.

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

| Evento Cliente → Servidor | Payload              | Descripción             |
| ------------------------- | -------------------- | ----------------------- |
| `room:create`             | `{ name?, bots? }`   | Crear sala nueva        |
| `room:join`               | `{ uid, playerId }`  | Unirse a sala existente |
| `game:action`             | `{ type, payload? }` | Enviar acción de juego  |

| Evento Servidor → Cliente | Payload           | Descripción                            |
| ------------------------- | ----------------- | -------------------------------------- |
| `rooms:list`              | `RoomSummary[]`   | Lista actualizada de salas (broadcast) |
| `room:created`            | `RoomSummary`     | Confirmación de creación               |
| `room:joined`             | `RoomSummary`     | Confirmación de unión                  |
| `room:error`              | `string`          | Sala llena, no existe, etc.            |
| `room:destroyed`          | `string`          | Sala eliminada al finalizar la partida |
| `game:state-update`       | `GameStateUpdate` | Estado sanitizado para ese jugador     |

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

| Archivo                                                 | Descripción                                     |
| ------------------------------------------------------- | ----------------------------------------------- |
| `libs/shared/game-engine/src/lib/shared-game-engine.ts` | Lógica pura: mazo, jerarquía, envido            |
| `libs/shared/game-engine/src/lib/truc-machine.ts`       | Máquina de estados XState + reparto de cartas   |
| `libs/shared/interfaces/src/lib/socket-events.ts`       | Todos los contratos de eventos y tipos          |
| `apps/backend/src/main.ts`                              | Gateway Socket.io + gestión de salas multi-room |
| `apps/backend/src/app/sanitize-state.ts`                | Función anti-trampas                            |
| `apps/backend/src/app/bot.ts`                           | IA Bot de pruebas                               |
| `apps/frontend/src/app/pages/Home.tsx`                  | Lobby en tiempo real                            |
| `apps/frontend/src/app/pages/GamePage.tsx`              | Cargador de partida desde URL + LocalStorage    |
| `apps/frontend/src/app/hooks/useTrucSocket.ts`          | Hook React para la conexión a la sala           |
| `apps/frontend/src/app/components/Board.tsx`            | Tablero principal de juego                      |
| `apps/frontend/src/app/components/Card.tsx`             | Carta con CSS Sprites + Framer Motion           |
