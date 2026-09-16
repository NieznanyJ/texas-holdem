import { Card, Suit, Rank } from './card.js';
import { randomInt } from 'node:crypto';

export class Deck {
  private readonly deck: Card[] = [];
  constructor() {
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        this.deck.push(new Card(suit, rank));
      }
    }
  }

  public shuffle(): void {
    let currentIndex = this.deck.length;

    while (currentIndex != 0) {
      let randomIndex = randomInt(currentIndex);
      currentIndex--;

      [this.deck[currentIndex], this.deck[randomIndex]] = [
        this.deck[randomIndex],
        this.deck[currentIndex],
      ];
    }
  }

  public draw(): Card {
    const card = this.deck.pop();
    if (!card) {
      throw new Error('Deck is empty');
    }
    return card;
  }
}
