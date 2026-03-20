# Instrucciones para el Agente de Desarrollo (valencia-truc)

## Contexto del Proyecto

Este es un monorepo gestionado con **Nx** para un videojuego del 'Truc Valencià'.

- **Frontend:** React + Tailwind CSS (`apps/frontend`)
- **Backend:** Node.js + Socket.io (`apps/backend`)
- **Lógica Compartida:** Librería de TypeScript pura (`libs/shared-logic`)
- **Contratos/Tipos:** Interfaces compartidas (`libs/shared-types`)

## Reglas de Oro del Desarrollo

1. **Single Source of Truth:** Toda la lógica de validación de jugadas (envido, truco, jerarquía de cartas) DEBE residir en `libs/shared-logic`. Nunca dupliques lógica en el frontend o backend.
2. **TypeScript Estricto:** Prohibido el uso de `any`. Usa Type Guards y Discriminated Unions para los estados del juego.
3. **Flujo de Nx:** - Para crear componentes: `nx generate @nx/react:component...`
   - Para nuevas librerías: `nx generate @nx/js:library...`
4. **Arquitectura de Sockets:** El backend es el "Dealer". El frontend solo envía intenciones (`intent`) y el backend responde con el estado actualizado (`state`).

## Especificaciones del Truc (Dominio)

- El juego se basa en una jerarquía no lineal (ver `README.md`).
- El estado es altamente volátil (interrupciones de Envido durante el Truco). Se prefiere el uso de Máquinas de Estados (XState).
