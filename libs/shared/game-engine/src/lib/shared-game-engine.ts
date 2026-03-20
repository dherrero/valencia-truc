import { Card, Suit, Value } from '@valencia-truc/shared-interfaces';

// Helper for map referencing
function getCardKey(card: Card): string {
  return `${card.value}-${card.suit}`;
}

const HIERARCHY = new Map<string, number>();

// Jerarquía de Poder (de mayor a menor):
HIERARCHY.set('1-Espadas', 10);
HIERARCHY.set('1-Bastos', 9);
HIERARCHY.set('7-Espadas', 8);
HIERARCHY.set('7-Oros', 7);

// Los Treses
HIERARCHY.set('3-Espadas', 6);
HIERARCHY.set('3-Bastos', 6);
HIERARCHY.set('3-Oros', 6);
HIERARCHY.set('3-Copas', 6);

// Sietes Falsos (Copas y Bastos)
HIERARCHY.set('7-Copas', 5);
HIERARCHY.set('7-Bastos', 5);

// Los Seises
HIERARCHY.set('6-Espadas', 4);
HIERARCHY.set('6-Bastos', 4);
HIERARCHY.set('6-Oros', 4);
HIERARCHY.set('6-Copas', 4);

// Los Cincos
HIERARCHY.set('5-Espadas', 3);
HIERARCHY.set('5-Bastos', 3);
HIERARCHY.set('5-Oros', 3);
HIERARCHY.set('5-Copas', 3);

// Los Cuatros
HIERARCHY.set('4-Espadas', 2);
HIERARCHY.set('4-Bastos', 2);
HIERARCHY.set('4-Oros', 2);
HIERARCHY.set('4-Copas', 2);

export const VALENCIA_DECK: Card[] = Array.from(HIERARCHY.keys()).map((key) => {
  const [val, suit] = key.split('-');
  return { suit: suit as Suit, value: parseInt(val, 10) as unknown as Value };
});

export function getCardPower(card: Card): number {
  const key = getCardKey(card);
  return HIERARCHY.get(key) || 0;
}

export function compareCards(card1: Card, card2: Card): number {
  return getCardPower(card1) - getCardPower(card2);
}

export function isValidCard(card: Card): boolean {
  if (card.value === 2 || card.value >= 8) return false;
  if (card.value === 1 && (card.suit === 'Copas' || card.suit === 'Oros')) return false;
  
  const key = getCardKey(card);
  return HIERARCHY.has(key);
}

export function calculateEnvido(cards: Card[]): number {
  if (cards.length === 0) return 0;

  const cardsBySuit = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (!cardsBySuit.has(card.suit)) {
      cardsBySuit.set(card.suit, []);
    }
    const suitList = cardsBySuit.get(card.suit);
    if (suitList) suitList.push(card);
  }

  let maxEnvido = 0;

  for (const suitCards of cardsBySuit.values()) {
    if (suitCards.length >= 2) {
      suitCards.sort((a, b) => b.value - a.value);
      const envido = 20 + suitCards[0].value + suitCards[1].value;
      if (envido > maxEnvido) {
        maxEnvido = envido;
      }
    } else if (suitCards.length === 1) {
      if (suitCards[0].value > maxEnvido) {
        maxEnvido = suitCards[0].value;
      }
    }
  }

  return maxEnvido;
}
