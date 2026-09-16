import { Card } from './card.js';

export class Player {
  private readonly hand: Card[] = [];
  public roundBet: number;
  public folded: boolean = false;
  public allIn: boolean = false;
  public totalBet: number = 0;

  constructor(
    public readonly userId: string,
    public readonly seat: number,
    public chips: number,
  ) {}

  public receiveCard(card: Card): void {
    if (this.hand.length >= 2) {
      throw new Error('Player already has two cards');
    }
    this.hand.push(card);
  }

  public getHand(): Card[] {
    return [...this.hand];
  }

  public clearHand(): void {
    this.hand.length = 0;
  }
}
