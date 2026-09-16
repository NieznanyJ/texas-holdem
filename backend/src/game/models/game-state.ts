import type { Rank, Suit } from './card.js';
import type { GamePhase } from './game.js';

export interface CardState {
  suit: Suit;
  rank: Rank;
}
export interface PlayerState {
  userId: string;
  seat: number;
  chips: number;
  inHand: boolean;
  folded: boolean;
  allIn: boolean;
  roundBet: number;
  totalBet: number;
  cardCount: number;
  /** Null means hidden; an empty array means no cards dealt. */
  hand: CardState[] | null;
}
export interface PotResult {
  amount: number;
  kind: 'pot' | 'refund';
  eligibleUserIds: string[];
  awards: { userId: string; amount: number }[];
}
export interface HandResult {
  reason: 'showdown' | 'fold';
  pots: PotResult[];
}
export interface GameState {
  id: string;
  handNumber: number;
  phase: GamePhase;
  maxPlayers: number;
  dealerSeat: number | null;
  smallBlindSeat: number | null;
  bigBlindSeat: number | null;
  currentPlayerSeat: number | null;
  smallBlind: number;
  bigBlind: number;
  currentBet: number;
  minRaise: number;
  canRaise: boolean;
  pot: number;
  communityCards: CardState[];
  players: PlayerState[];
  result: HandResult | null;
}
