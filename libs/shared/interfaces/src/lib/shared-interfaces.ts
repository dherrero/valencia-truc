export type Suit = 'Espadas' | 'Bastos' | 'Oros' | 'Copas';
export type Value = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Card {
  suit: Suit;
  value: Value;
}
