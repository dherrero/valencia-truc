import {
  isValidCard,
  compareCards,
  calculateEnvido,
  VALENCIA_DECK,
} from './shared-game-engine.js';
import { Card } from '@valencia-truc/shared-interfaces';

describe('Truc Valencià - Game Engine Rules', () => {
  describe('Jerarquía de Poder', () => {
    it('As de Espadas gana al As de Bastos', () => {
      const p1: Card = { suit: 'Espadas', value: 1 };
      const p2: Card = { suit: 'Bastos', value: 1 };
      expect(compareCards(p1, p2)).toBeGreaterThan(0); // p1 wins
    });
    
    it('7 de Oros gana a los Treses', () => {
      const p1: Card = { suit: 'Oros', value: 7 };
      const p2: Card = { suit: 'Copas', value: 3 };
      expect(compareCards(p1, p2)).toBeGreaterThan(0);
    });

    it('Los Treses ganan a los Sietes Falsos (Copas/Bastos)', () => {
      const p1: Card = { suit: 'Espadas', value: 3 };
      const p2: Card = { suit: 'Copas', value: 7 };
      expect(compareCards(p1, p2)).toBeGreaterThan(0);
      
      const p3: Card = { suit: 'Bastos', value: 7 };
      expect(compareCards(p1, p3)).toBeGreaterThan(0);
    });
  });

  describe('Validación de Mazo', () => {
    it('devuelve false si se intenta usar un 2', () => {
      expect(isValidCard({ suit: 'Espadas', value: 2 })).toBe(false);
    });

    it('devuelve false si se usa un As de Copas/Oros', () => {
      expect(isValidCard({ suit: 'Copas', value: 1 })).toBe(false);
      expect(isValidCard({ suit: 'Oros', value: 1 })).toBe(false);
    });

    it('devuelve false para cualquier figura (10, 11, 12)', () => {
      expect(isValidCard({ suit: 'Espadas', value: 10 })).toBe(false);
      expect(isValidCard({ suit: 'Oros', value: 11 })).toBe(false);
      expect(isValidCard({ suit: 'Copas', value: 12 })).toBe(false);
    });

    it('devuelve false para 8s y 9s (por si acaso)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidCard({ suit: 'Bastos', value: 8 as any })).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidCard({ suit: 'Bastos', value: 9 as any })).toBe(false);
    });

    it('devuelve true para unas cartas correctas', () => {
      expect(isValidCard({ suit: 'Espadas', value: 7 })).toBe(true);
      expect(isValidCard({ suit: 'Oros', value: 3 })).toBe(true);
    });
    
    it('tiene exactamente 22 cartas definidas', () => {
        expect(VALENCIA_DECK.length).toBe(22);
    })
  });

  describe('Cálculo de Envido', () => {
    it('suma los valores + 20 si hay dos cartas del mismo palo', () => {
      // 7 y 6 de Espadas = 33
      const hand: Card[] = [
        { suit: 'Espadas', value: 7 },
        { suit: 'Espadas', value: 6 },
        { suit: 'Copas', value: 3 }
      ];
      expect(calculateEnvido(hand)).toBe(33);
    });

    it('asegura que los Ases valen 1 punto en suma de palo', () => {
      // 1 y 7 de Espadas = 28
      const hand: Card[] = [
        { suit: 'Espadas', value: 7 },
        { suit: 'Espadas', value: 1 },
        { suit: 'Copas', value: 3 }
      ];
      expect(calculateEnvido(hand)).toBe(28);
    });

    it('toma la carta más alta si no hay pareja de palos', () => {
      // 7 Espadas, 1 Bastos, 6 Copas = 7
      const hand: Card[] = [
        { suit: 'Espadas', value: 7 },
        { suit: 'Bastos', value: 1 },
        { suit: 'Copas', value: 6 }
      ];
      expect(calculateEnvido(hand)).toBe(7);
    });

    it('prioriza las dos cartas más altas si hay tres del mismo palo', () => {
      const hand: Card[] = [
        { suit: 'Espadas', value: 7 },
        { suit: 'Espadas', value: 6 },
        { suit: 'Espadas', value: 1 }
      ];
      // 7 + 6 + 20 = 33
      expect(calculateEnvido(hand)).toBe(33);
    });
  });
});
