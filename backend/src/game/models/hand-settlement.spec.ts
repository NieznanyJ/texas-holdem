import { Card, Rank, Suit } from './card.js';
import { evaluateHand, compareHands } from './hand-evaluator.js';
import { Game, GamePhase } from './game.js';
import { Player } from './player.js';

function cards(text: string): Card[] {
  const suits: Record<string, Suit> = {
    c: Suit.Clubs,
    d: Suit.Diamonds,
    h: Suit.Hearts,
    s: Suit.Spades,
  };
  return text
    .split(' ')
    .map(
      (token) => new Card(suits[token.slice(-1)], token.slice(0, -1) as Rank),
    );
}

// Access internal state only to arrange deterministic hands before public action APIs exist.
type State = {
  handPlayers: Player[];
  communityCards: Card[];
  phase: GamePhase;
  dealerSeat: number;
  pot: number;
  finishHand(): void;
};
function setup(
  hands: string[],
  bets: number[],
  board: string,
  folded: number[] = [],
) {
  const game = new Game('test', 5, 10);
  const state = game as unknown as State;
  const players = hands.map((hand, i) => {
    const player = new Player(String(i), i, 0);
    cards(hand).forEach((card) => player.receiveCard(card));
    player.totalBet = bets[i];
    player.folded = folded.includes(i);
    return player;
  });
  state.handPlayers.push(...players);
  state.communityCards.push(...cards(board));
  state.phase = GamePhase.Showdown;
  state.dealerSeat = 0;
  state.pot = bets.reduce((a, b) => a + b, 0);
  return { state, players };
}

describe('hand evaluation', () => {
  it.each([
    ['As Ks Qs Js 10s', 8],
    ['Ac Ad Ah As 2c', 7],
    ['Ac Ad Ah Ks Kc', 6],
    ['As Js 8s 5s 2s', 5],
    ['Ac 2d 3h 4s 5c', 4],
    ['Ac Ad Ah Ks 2c', 3],
    ['Ac Ad Kh Ks 2c', 2],
    ['Ac Ad Kh 8s 2c', 1],
    ['Ac Jd 9h 8s 2c', 0],
  ])('evaluates %s', (hand, category) => {
    expect(evaluateHand(cards(hand)).category).toBe(category);
  });
  it('handles the wheel, kickers, two trips and board-only hands', () => {
    expect(
      compareHands(
        evaluateHand(cards('Ac 2d 3h 4s 5c')),
        evaluateHand(cards('2c 3d 4h 5s 6c')),
      ),
    ).toBeLessThan(0);
    expect(
      compareHands(
        evaluateHand(cards('Ac Ad Kh 8s 2c')),
        evaluateHand(cards('Ah As Qh Js 9c')),
      ),
    ).toBeGreaterThan(0);
    expect(evaluateHand(cards('Ac Ad Ah Ks Kc Kh 2c'))).toEqual({
      category: 6,
      kickers: [14, 13],
    });
    expect(evaluateHand(cards('As Ks Qs Js 10s 2h 3d'))).toEqual({
      category: 8,
      kickers: [14],
    });
  });
});

describe('hand settlement', () => {
  it('pays main/side pots and returns an unmatched bet', () => {
    const { state, players } = setup(
      ['Ac Ad', 'Kc Kd', 'Qc Qd'],
      [50, 100, 150],
      '2c 3d 7h 8s 9c',
    );
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([150, 100, 50]);
    expect(state.pot).toBe(0);
    expect(state.phase).toBe(GamePhase.Finished);
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([150, 100, 50]);
  });
  it('includes folded contributions and awards odd chips after the dealer', () => {
    const { state, players } = setup(
      ['2c 3c', '4c 5c', '6c 7c'],
      [5, 5, 5],
      'As Ks Qs Js 10s',
      [2],
    );
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([7, 8, 0]);
  });
  it('never lets a folded stronger hand win', () => {
    const { state, players } = setup(
      ['Ac Ad', 'Kc Kd', 'Qc Qd'],
      [100, 100, 100],
      '2c 3d 7h 8s 9c',
      [0],
    );
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([0, 300, 0]);
  });
  it('does not pay anything when contributions are inconsistent', () => {
    const { state, players } = setup(
      ['Ac Ad', 'Kc Kd'],
      [100, 100],
      '2c 3d 7h 8s 9c',
    );
    state.pot = 201;
    expect(() => state.finishHand()).toThrow();
    expect(players.map((p) => p.chips)).toEqual([0, 0]);
    expect(state.pot).toBe(201);
  });
  it('settles a hand that ends before showdown', () => {
    const { state, players } = setup(
      ['Ac Ad', 'Kc Kd'],
      [10, 10],
      '2c 3d 7h',
      [1],
    );
    state.phase = GamePhase.Flop;
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([20, 0]);
  });
});

describe('additional side-pot cases', () => {
  it('splits the main pot while only one tied player wins the side pot', () => {
    const { state, players } = setup(
      ['Ac Kd', 'Ad Kc', 'Qc Jd'],
      [50, 100, 100],
      'As 2d 7h 8s 9c',
    );
    state.finishHand();
    // The two ace-pair hands tie; only the deeper stack can win the side pot.
    expect(players.map((p) => p.chips)).toEqual([75, 175, 0]);
  });
  it('splits each layer independently including folded dead money', () => {
    const { state, players } = setup(
      ['2c 3c', '4c 5c', '6c 7c', '8c 9c'],
      [5, 10, 10, 10],
      'As Ks Qs Js 10s',
      [3],
    );
    state.finishHand();
    expect(players.map((p) => p.chips)).toEqual([6, 15, 14, 0]);
    expect(players.reduce((sum, p) => sum + p.chips, 0)).toBe(35);
  });
});
