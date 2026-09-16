import { Game } from '../../game/models/game.js';

export class Room {
  public readonly game: Game;
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    smallBlind: number,
    bigBlind: number,
    maxPlayers: number = 9,
  ) {
    this.game = new Game(id, smallBlind, bigBlind, maxPlayers);
  }
}
