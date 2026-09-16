import { Game } from './game.js';
import { Player } from './player.js';

function table(stacks: number[]) {
  const game = new Game('test', 5, 10);
  stacks.forEach((chips, seat) =>
    game.addPlayer(new Player(String(seat), seat, chips)),
  );
  game.startHand();
  return game;
}

describe('betting actions', () => {
  it('does not reopen raising after a short all-in for a caller', () => {
    const game = table([200, 15, 200]);
    game.call('0');
    game.raise('1', 15);
    game.call('2');
    expect(() => game.raise('0', 30)).toThrow('not reopened');
    game.call('0');
    // A new street clears action history and permits a new opening bet.
    game.bet('2', 10);
    game.raise('0', 20);
  });

  it('allows the big blind to raise after checking is not yet required', () => {
    const game = table([200, 200, 200]);
    game.call('0');
    game.call('1');
    game.raise('2', 30);
    game.call('0');
    game.call('1');
    game.check('1');
    game.bet('2', 10);
    game.call('0');
    game.raise('1', 20);
  });

  it('rejects invalid moves without consuming the turn', () => {
    const game = table([100, 100]);
    expect(() => game.check('0')).toThrow();
    expect(() => game.raise('0', 11)).toThrow();
    expect(() => game.raise('0', NaN)).toThrow();
    game.call('0');
    game.check('1');
    expect(() => game.bet('1', 0)).toThrow();
    game.bet('1', 10);
    game.call('0');
  });
});

describe('complete game and private state', () => {
  it('enforces table capacity and seat bounds', () => {
    expect(() => new Game('bad', 5, 10, 11)).toThrow();
    const game = new Game('two', 5, 10, 2);
    expect(() => game.addPlayer(new Player('bad', 2, 100))).toThrow();
    game.addPlayer(new Player('0', 0, 100));
    game.addPlayer(new Player('1', 1, 100));
    expect(() => game.addPlayer(new Player('2', 0, 100))).toThrow();
  });

  it('plays a complete hand and starts the next with fresh state', () => {
    const game = table([100, 100, 100]);
    expect(() => game.getStateForPlayer('stranger')).toThrow();
    let state = game.getStateForPlayer('0');
    expect(state.players[0].hand).toHaveLength(2);
    expect(state.players[1].hand).toBeNull();
    expect(JSON.stringify(state)).not.toContain('"deck"');
    state.players[0].chips = 999;
    state.players[0].hand!.length = 0;
    expect(game.getStateForPlayer('0').players[0].chips).toBe(100);
    expect(game.getStateForPlayer('0').players[0].hand).toHaveLength(2);
    game.call('0');
    game.call('1');
    game.check('2');
    for (let street = 0; street < 3; street++) {
      game.check('1');
      game.check('2');
      game.check('0');
    }
    state = game.getStateForPlayer('0');
    expect(state.phase).toBe('finished');
    expect(state.result?.reason).toBe('showdown');
    expect(state.players.every((player) => player.hand?.length === 2)).toBe(
      true,
    );
    expect(state.players.reduce((sum, p) => sum + p.chips, state.pot)).toBe(
      300,
    );
    state.result!.pots[0].awards.length = 0;
    expect(
      game.getStateForPlayer('0').result!.pots[0].awards.length,
    ).toBeGreaterThan(0);
    game.startHand();
    state = game.getStateForPlayer('0');
    expect(state.handNumber).toBe(2);
    expect(state.dealerSeat).toBe(1);
    expect(state.communityCards).toEqual([]);
    expect(state.result).toBeNull();
    expect(state.players[1].hand).toBeNull();
  });

  it('keeps folded hands and uncontested winning cards private', () => {
    const game = table([100, 100, 100]);
    game.fold('0');
    game.fold('1');
    const state = game.getStateForPlayer('0');
    expect(state.result?.reason).toBe('fold');
    expect(state.players[1].hand).toBeNull();
    expect(state.players[2].hand).toBeNull();
    expect(state.players.reduce((sum, p) => sum + p.chips, 0)).toBe(300);
  });

  it('handles a lone actor facing a short blind without a phantom call', () => {
    const game = table([100, 3]);
    const state = game.getStateForPlayer('0');
    expect(state.phase).toBe('finished');
    expect(
      state.result?.pots.some(
        (pot) => pot.kind === 'refund' && pot.amount === 2,
      ),
    ).toBe(true);
    expect(state.players.reduce((sum, p) => sum + p.chips, 0)).toBe(103);
  });

  it('allows only an actual outstanding all-in amount to be called', () => {
    const game = table([100, 8]);
    expect(game.getStateForPlayer('0').currentBet).toBe(8);
    expect(() => game.raise('0', 20)).toThrow();
    game.call('0');
    expect(game.getStateForPlayer('0').phase).toBe('finished');
    expect(
      game.getStateForPlayer('0').players.reduce((sum, p) => sum + p.chips, 0),
    ).toBe(108);
  });

  it('keeps the nominal big blind when multiple players can bet', () => {
    const game = table([100, 100, 3]);
    expect(game.getStateForPlayer('0').currentBet).toBe(10);
    game.call('0');
    game.call('1');
    expect(game.getStateForPlayer('0').phase).toBe('flop');
  });

  it('reopens betting after cumulative short raises reach a full raise', () => {
    const game = table([200, 15, 20, 200]);
    game.call('3');
    game.call('0');
    game.raise('1', 15);
    game.raise('2', 20);
    game.raise('3', 30);
    expect(game.getStateForPlayer('0').currentBet).toBe(30);
  });

  it('allows a checker to raise a short opening all-in but not a caller', () => {
    const game = table([200, 200, 15, 200]);
    game.call('3');
    game.call('0');
    game.call('1');
    game.check('2');
    game.check('1');
    game.bet('2', 5);
    game.call('3');
    game.raise('0', 15);
    game.call('1');
    game.raise('3', 25);
    expect(game.getStateForPlayer('0').currentBet).toBe(25);
  });

  it('rejects non-all-in underraises and preserves state on error', () => {
    const game = table([200, 200, 15, 200]);
    game.call('3');
    game.call('0');
    game.call('1');
    game.check('2');
    game.check('1');
    game.bet('2', 5);
    const before = game.getStateForPlayer('3');
    expect(() => game.raise('3', 10)).toThrow();
    expect(game.getStateForPlayer('3')).toEqual(before);
    game.raise('3', 15);
  });
});
