import type { GameState, HandResult, PotResult } from './game-state.js';
import { evaluateHand, compareHands } from './hand-evaluator.js';
import { Card } from './card.js';
import { Deck } from './deck.js';
import { Player } from './player.js';

export enum GamePhase {
  Waiting = 'waiting',
  Preflop = 'preflop',
  Flop = 'flop',
  Turn = 'turn',
  River = 'river',
  Showdown = 'showdown',
  Finished = 'finished',
}

export class Game {
  private deck = new Deck();
  private readonly players: Player[] = [];
  private readonly handPlayers: Player[] = [];
  private readonly communityCards: Card[] = [];

  private phase: GamePhase = GamePhase.Waiting;

  private dealerSeat: number | null = null;
  private smallBlindSeat: number | null = null;
  private bigBlindSeat: number | null = null;
  private currentPlayerSeat: number | null = null;

  private currentBet = 0;
  private minRaise: number;
  private pot = 0;
  private handNumber = 0;
  private result: HandResult | null = null;

  private readonly pendingActions = new Set<string>();
  private readonly lastActionBet = new Map<string, number>();

  constructor(
    public readonly id: string,
    private readonly smallBlind: number,
    private readonly bigBlind: number,
    public readonly maxPlayers: number = 9,
  ) {
    if (
      !Number.isSafeInteger(smallBlind) ||
      !Number.isSafeInteger(bigBlind) ||
      smallBlind <= 0 ||
      bigBlind < smallBlind
    ) {
      throw new Error('Invalid blinds');
    }

    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 10) {
      throw new Error('Table must have between 2 and 10 seats');
    }
    this.minRaise = bigBlind;
  }

  public addPlayer(player: Player): void {
    this.assertRosterMutable();
    if (this.players.length >= this.maxPlayers)
      throw new Error('Table is full');
    if (
      !Number.isSafeInteger(
        this.players.reduce((sum, p) => sum + p.chips, player.chips),
      )
    )
      throw new Error('Total chips exceed safe integer range');
    if (this.players.some((existing) => existing.userId === player.userId)) {
      throw new Error(`Player ${player.userId} already in the game`);
    }

    if (this.players.some((existing) => existing.seat === player.seat)) {
      throw new Error('Seat is already occupied');
    }
    if (
      !Number.isInteger(player.seat) ||
      player.seat < 0 ||
      player.seat >= this.maxPlayers ||
      !Number.isSafeInteger(player.chips) ||
      player.chips < 0
    ) {
      throw new Error('Invalid seat or chips');
    }

    this.players.push(player);
  }

  public removePlayer(userId: string): void {
    this.assertRosterMutable();
    const index = this.players.findIndex((player) => player.userId === userId);

    if (index === -1) {
      throw new Error(`Player with ${userId} not found`);
    }

    this.players.splice(index, 1);
  }

  private assertRosterMutable(): void {
    if (this.phase !== GamePhase.Waiting && this.phase !== GamePhase.Finished) {
      throw new Error('Cannot change players during a hand');
    }
  }

  private advancePhase(): void {
    switch (this.phase) {
      case GamePhase.Preflop:
        this.deck.draw(); // burn the card
        this.communityCards.push(
          this.deck.draw(),
          this.deck.draw(),
          this.deck.draw(),
        );
        this.phase = GamePhase.Flop;
        break;

      case GamePhase.Flop:
        this.deck.draw(); // burn the card
        this.communityCards.push(this.deck.draw());
        this.phase = GamePhase.Turn;
        break;

      case GamePhase.Turn:
        this.deck.draw(); // burn the card
        this.communityCards.push(this.deck.draw());
        this.phase = GamePhase.River;
        break;

      case GamePhase.River:
        this.phase = GamePhase.Showdown;
        this.currentPlayerSeat = null;
        this.finishHand();
        return;

      default:
        throw new Error('Cannot advance phase');
    }

    this.currentBet = 0;
    this.minRaise = this.bigBlind;

    for (const player of this.handPlayers) {
      player.roundBet = 0;
    }

    this.startBettingRound();
    this.normalizeUncontestedBet();
    if (this.pendingActions.size === 0) {
      this.advancePhase();
    }
  }

  private startBettingRound(): void {
    this.lastActionBet.clear();
    if (this.dealerSeat === null) {
      throw new Error('Dealer is not assigned');
    }

    const dealerSeat = this.dealerSeat;

    const activePlayers = this.handPlayers
      .filter((player) => !player.folded && !player.allIn)
      .sort((a, b) => a.seat - b.seat);

    this.pendingActions.clear();

    if (activePlayers.length < 2) {
      this.currentPlayerSeat = null;
      return;
    }

    for (const player of activePlayers) {
      this.pendingActions.add(player.userId);
    }

    const firstPlayer =
      activePlayers.find((player) => player.seat > dealerSeat) ??
      activePlayers[0];

    this.currentPlayerSeat = firstPlayer.seat;
  }

  private advanceTurn(): void {
    const activePlayers = this.handPlayers.filter((player) => !player.folded);

    if (activePlayers.length === 1) {
      this.finishHand();
      return;
    }

    this.normalizeUncontestedBet();
    if (this.pendingActions.size === 0) {
      this.advancePhase();
      return;
    }

    if (this.currentPlayerSeat === null) {
      throw new Error('There is no current player');
    }

    const currentSeat = this.currentPlayerSeat;

    const candidates = activePlayers
      .filter(
        (player) => !player.allIn && this.pendingActions.has(player.userId),
      )
      .sort((a, b) => a.seat - b.seat);

    const nextPlayer =
      candidates.find((player) => player.seat > currentSeat) ?? candidates[0];

    if (!nextPlayer) {
      throw new Error('Pending actions contain no eligible player');
    }

    this.currentPlayerSeat = nextPlayer.seat;
  }

  private validateHandStart(): void {
    if (this.phase !== GamePhase.Waiting && this.phase !== GamePhase.Finished) {
      throw new Error('A hand is already in progress');
    }

    const eligiblePlayers = this.players.filter((player) => player.chips > 0);

    if (eligiblePlayers.length < 2) {
      throw new Error('At least two players with chips are required');
    }
  }

  private resetHandState(): void {
    this.validateHandStart();
    if (this.pot !== 0) {
      throw new Error('Previous pot has not been settled');
    }
    this.result = null;
    this.communityCards.length = 0;
    this.currentBet = 0;
    this.pot = 0;
    this.currentPlayerSeat = null;

    for (const player of this.handPlayers) {
      player.clearHand();
      player.folded = false;
      player.allIn = false;
      player.roundBet = 0;
      player.totalBet = 0;
    }

    this.pendingActions.clear();
    this.lastActionBet.clear();
    this.minRaise = this.bigBlind;
  }

  private prepareDeck(): void {
    this.deck = new Deck();
    this.deck.shuffle();
  }

  private assignPositions(): void {
    const participants = [...this.handPlayers].sort((a, b) => a.seat - b.seat);

    if (participants.length < 2) {
      throw new Error('At least two players are required');
    }

    const previousDealerSeat = this.dealerSeat;

    let dealerIndex = 0;

    if (previousDealerSeat !== null) {
      const nextIndex = participants.findIndex(
        (player) => player.seat > previousDealerSeat,
      );

      dealerIndex = nextIndex === -1 ? 0 : nextIndex;
    }

    const smallBlindIndex =
      participants.length === 2
        ? dealerIndex
        : (dealerIndex + 1) % participants.length;

    const bigBlindIndex = (smallBlindIndex + 1) % participants.length;

    this.dealerSeat = participants[dealerIndex].seat;
    this.smallBlindSeat = participants[smallBlindIndex].seat;
    this.bigBlindSeat = participants[bigBlindIndex].seat;
  }

  private postBlinds(): void {
    const smallBlindPlayer = this.handPlayers.find(
      (player) => player.seat === this.smallBlindSeat,
    );

    const bigBlindPlayer = this.handPlayers.find(
      (player) => player.seat === this.bigBlindSeat,
    );

    if (!smallBlindPlayer || !bigBlindPlayer) {
      throw new Error('Blind players are not assigned');
    }

    this.postBlind(smallBlindPlayer, this.smallBlind);
    this.postBlind(bigBlindPlayer, this.bigBlind);

    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
  }

  private postBlind(player: Player, blind: number): void {
    const amount = Math.min(player.chips, blind);

    player.chips -= amount;
    player.roundBet += amount;
    player.totalBet += amount;
    player.allIn = player.chips === 0;

    this.pot += amount;
  }

  private dealHoleCards(): void {
    const dealerSeat = this.dealerSeat;
    if (dealerSeat === null) {
      throw new Error('Dealer is not assigned');
    }
    const ordered = [...this.handPlayers].sort((a, b) => a.seat - b.seat);
    const firstIndex = ordered.findIndex((player) => player.seat > dealerSeat);
    const startIndex = firstIndex === -1 ? 0 : firstIndex;
    const dealingOrder = [
      ...ordered.slice(startIndex),
      ...ordered.slice(0, startIndex),
    ];
    for (let i = 0; i < 2; i++) {
      for (const player of dealingOrder) {
        player.receiveCard(this.deck.draw());
      }
    }
  }

  private startPreflopBetting(): void {
    this.lastActionBet.clear();
    if (this.bigBlindSeat === null) {
      throw new Error('Big blind is not assigned');
    }

    const bigBlindSeat = this.bigBlindSeat;

    this.phase = GamePhase.Preflop;
    this.pendingActions.clear();
    this.currentPlayerSeat = null;

    const candidates = this.handPlayers
      .filter((player) => !player.folded && !player.allIn)
      .sort((a, b) => a.seat - b.seat);

    for (const player of candidates) {
      this.pendingActions.add(player.userId);
    }

    if (candidates.length === 1 && candidates[0].roundBet >= this.currentBet) {
      this.pendingActions.clear();
    }

    this.normalizeUncontestedBet();
    if (this.pendingActions.size === 0) {
      this.advancePhase();
      return;
    }

    const firstPlayer =
      candidates.find((player) => player.seat > bigBlindSeat) ?? candidates[0];

    this.currentPlayerSeat = firstPlayer.seat;
  }

  public startHand(): void {
    this.validateHandStart();
    this.resetHandState();
    this.prepareDeck();
    this.handPlayers.length = 0;
    this.handPlayers.push(...this.players.filter((player) => player.chips > 0));
    for (const player of this.handPlayers) {
      player.clearHand();
      player.folded = false;
      player.allIn = false;
      player.roundBet = 0;
      player.totalBet = 0;
    }
    this.assignPositions();
    this.postBlinds();
    this.dealHoleCards();
    this.handNumber++;
    this.startPreflopBetting();
  }

  private finishHand(): void {
    if (this.phase === GamePhase.Finished) return;

    const contenders = this.handPlayers.filter((player) => !player.folded);

    if (contenders.length === 0) throw new Error('No remaining players');
    if (
      contenders.length > 1 &&
      (this.phase !== GamePhase.Showdown || this.communityCards.length !== 5)
    ) {
      throw new Error('Showdown requires five community cards');
    }

    if (this.dealerSeat === null) throw new Error('Dealer is not assigned');

    const contributions = this.handPlayers.map((player) => player.totalBet);

    if (
      contributions.some(
        (amount) => !Number.isSafeInteger(amount) || amount < 0,
      ) ||
      contributions.reduce((sum, amount) => sum + amount, 0) !== this.pot
    ) {
      throw new Error('Pot does not match player contributions');
    }

    // Calculate everything before changing stacks, so errors cannot cause partial payouts.
    const potResults: PotResult[] = [];
    const payouts = new Map(this.handPlayers.map((player) => [player, 0]));
    const values = new Map(
      contenders.length > 1
        ? contenders.map((player) => {
            const hand = player.getHand();
            if (hand.length !== 2)
              throw new Error('Player must have two cards');
            return [
              player,
              evaluateHand([...hand, ...this.communityCards]),
            ] as const;
          })
        : [],
    );
    const levels = [
      ...new Set(contributions.filter((amount) => amount > 0)),
    ].sort((a, b) => a - b);
    let previous = 0;
    const dealerSeat = this.dealerSeat;

    for (const level of levels) {
      const contributors = this.handPlayers.filter(
        (player) => player.totalBet >= level,
      );
      const amount = (level - previous) * contributors.length;
      previous = level;
      // A contribution that nobody matched is returned to its owner.
      let winners =
        contributors.length === 1
          ? contributors
          : contenders.length === 1
            ? contenders
            : contributors.filter((player) => !player.folded);
      const eligibleUserIds = winners.map((player) => player.userId);
      if (winners.length === 0)
        throw new Error('Side pot has no eligible player');
      if (winners.length > 1) {
        let best = values.get(winners[0])!;
        for (const player of winners) {
          const value = values.get(player)!;
          if (compareHands(value, best) > 0) best = value;
        }
        winners = winners.filter(
          (player) => compareHands(values.get(player)!, best) === 0,
        );
      }
      // Odd chips go clockwise, starting with the first winner after the dealer.
      winners.sort(
        (a, b) =>
          Number(a.seat <= dealerSeat) - Number(b.seat <= dealerSeat) ||
          a.seat - b.seat,
      );
      const share = Math.floor(amount / winners.length);
      const remainder = amount % winners.length;
      potResults.push({
        amount,
        kind: contributors.length === 1 ? 'refund' : 'pot',
        eligibleUserIds,
        awards: winners.map((player, index) => ({
          userId: player.userId,
          amount: share + (index < remainder ? 1 : 0),
        })),
      });
      winners.forEach((player, index) => {
        payouts.set(
          player,
          payouts.get(player)! + share + (index < remainder ? 1 : 0),
        );
      });
    }

    for (const [player, amount] of payouts) {
      if (!Number.isSafeInteger(player.chips + amount))
        throw new Error('Invalid resulting stack');
    }
    for (const [player, amount] of payouts) player.chips += amount;
    this.result = {
      reason: contenders.length > 1 ? 'showdown' : 'fold',
      pots: potResults,
    };
    this.pot = 0;
    this.phase = GamePhase.Finished;
    this.currentPlayerSeat = null;
    this.pendingActions.clear();
  }

  private canPlayerRaise(userId: string): boolean {
    const player = this.handPlayers.find(p => p.userId === userId);
    if (!player || player.folded || player.allIn ||
        player.seat !== this.currentPlayerSeat ||
        !this.pendingActions.has(userId)) return false;
    if (player.roundBet + player.chips <= this.currentBet) return false;
    const opponent = this.handPlayers.some(p => p !== player && !p.folded && !p.allIn && p.chips > 0);
    const lastBet = this.lastActionBet.get(userId);
    return opponent && (lastBet === undefined || lastBet === 0 || this.currentBet - lastBet >= this.minRaise);
  }

  public getStateForPlayer(userId: string): GameState {
    if (!this.players.some((player) => player.userId === userId)) {
      throw new Error('Player is not at this table');
    }
    return {
      canRaise: this.canPlayerRaise(userId),
      id: this.id,
      handNumber: this.handNumber,
      phase: this.phase,
      maxPlayers: this.maxPlayers,
      dealerSeat: this.dealerSeat,
      smallBlindSeat: this.smallBlindSeat,
      bigBlindSeat: this.bigBlindSeat,
      currentPlayerSeat: this.currentPlayerSeat,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      pot: this.pot,
      communityCards: this.communityCards.map((card) => ({
        suit: card.suit,
        rank: card.rank,
      })),
      players: this.players.map((player) => {
        const inHand = this.handPlayers.includes(player);
        const hand = inHand ? player.getHand() : [];
        const visible =
          player.userId === userId ||
          (this.result?.reason === 'showdown' && inHand && !player.folded);
        return {
          userId: player.userId,
          seat: player.seat,
          chips: player.chips,
          inHand,
          folded: inHand && player.folded,
          allIn: inHand && player.allIn,
          roundBet: inHand ? player.roundBet : 0,
          totalBet: inHand ? player.totalBet : 0,
          cardCount: hand.length,
          hand:
            visible || hand.length === 0
              ? hand.map((card) => ({ suit: card.suit, rank: card.rank }))
              : null,
        };
      }),
      result: this.result === null ? null : structuredClone(this.result),
    };
  }

  /** With only one player able to act, only actual opposing wagers can be called. */
  private normalizeUncontestedBet(): void {
    const contenders = this.handPlayers.filter((player) => !player.folded);
    const actors = contenders.filter((player) => !player.allIn);
    if (actors.length !== 1) return;
    const actor = actors[0];
    const opposingBet = Math.max(
      0,
      ...contenders
        .filter((player) => player !== actor)
        .map((player) => player.roundBet),
    );
    this.currentBet = Math.max(actor.roundBet, opposingBet);
    this.pendingActions.clear();
    if (actor.roundBet < this.currentBet) this.pendingActions.add(actor.userId);
  }

  private getPlayerForAction(userId: string): Player {
    const bettingPhases = [
      GamePhase.Preflop,
      GamePhase.Flop,
      GamePhase.Turn,
      GamePhase.River,
    ];

    if (!bettingPhases.includes(this.phase)) {
      throw new Error('Betting is not in progress');
    }

    const player = this.handPlayers.find((player) => player.userId === userId);

    if (!player) {
      throw new Error('Player is not participating in this hand');
    }

    if (player.folded || player.allIn) {
      throw new Error('Player cannot act');
    }

    if (
      player.seat !== this.currentPlayerSeat ||
      !this.pendingActions.has(player.userId)
    ) {
      throw new Error('It is not your turn');
    }

    return player;
  }

  public fold(userId: string): void {
    const player = this.getPlayerForAction(userId);

    player.folded = true;
    this.pendingActions.delete(userId);

    this.advanceTurn();
  }

  public check(userId: string): void {
    const player = this.getPlayerForAction(userId);

    if (player.roundBet !== this.currentBet) {
      throw new Error('Cannot check: there is a bet to call');
    }

    this.lastActionBet.set(userId, this.currentBet);
    this.pendingActions.delete(userId);
    this.advanceTurn();
  }

  public call(userId: string): void {
    const player = this.getPlayerForAction(userId);

    const amountToCall = this.currentBet - player.roundBet;

    if (amountToCall <= 0) {
      throw new Error('Nothing to call: use check');
    }

    const amount = Math.min(amountToCall, player.chips);

    this.commitChips(player, amount);
    this.lastActionBet.set(userId, this.currentBet);

    this.pendingActions.delete(userId);
    this.advanceTurn();
  }

  public bet(userId: string, amount: number): void {
    const player = this.getPlayerForAction(userId);

    if (this.currentBet !== 0) {
      throw new Error('A bet already exists: use raise');
    }

    this.validateBetAmount(player, amount);
    this.assertOpponentCanBet(player);

    if (amount < this.bigBlind && amount !== player.chips) {
      throw new Error('Bet must be at least the big blind or all-in');
    }

    this.commitChips(player, amount);

    this.currentBet = player.roundBet;
    this.minRaise = Math.max(this.bigBlind, this.currentBet);
    this.lastActionBet.set(userId, this.currentBet);

    this.requestResponses(player);
    this.advanceTurn();
  }

  public raise(userId: string, totalBet: number): void {
    const player = this.getPlayerForAction(userId);

    if (this.currentBet === 0) {
      throw new Error('No bet exists: use bet');
    }

    if (!Number.isSafeInteger(totalBet) || totalBet <= this.currentBet) {
      throw new Error('Raise must exceed the current bet');
    }

    this.assertOpponentCanBet(player);

    const lastBet = this.lastActionBet.get(userId);

    if (
      lastBet !== undefined &&
      lastBet !== 0 &&
      this.currentBet - lastBet < this.minRaise
    ) {
      throw new Error('Betting has not reopened for this player');
    }

    const amount = totalBet - player.roundBet;
    const raiseSize = totalBet - this.currentBet;

    this.validateBetAmount(player, amount);

    if (raiseSize < this.minRaise && amount !== player.chips) {
      throw new Error('Raise is too small unless all-in');
    }

    this.commitChips(player, amount);

    if (raiseSize >= this.minRaise) {
      this.minRaise = raiseSize;
    }

    this.currentBet = totalBet;
    this.lastActionBet.set(userId, this.currentBet);

    this.requestResponses(player);
    this.advanceTurn();
  }

  private validateBetAmount(player: Player, amount: number): void {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > player.chips) {
      throw new Error('Invalid bet amount');
    }
  }

  private assertOpponentCanBet(player: Player): void {
    const hasOpponent = this.handPlayers.some(
      (opponent) =>
        opponent !== player &&
        !opponent.folded &&
        !opponent.allIn &&
        opponent.chips > 0,
    );

    if (!hasOpponent) {
      throw new Error('No opponent can respond to a bet');
    }
  }

  private commitChips(player: Player, amount: number): void {
    this.validateBetAmount(player, amount);

    player.chips -= amount;
    player.roundBet += amount;
    player.totalBet += amount;
    this.pot += amount;

    player.allIn = player.chips === 0;
  }

  private requestResponses(actingPlayer: Player): void {
    this.pendingActions.clear();

    for (const player of this.handPlayers) {
      if (
        player !== actingPlayer &&
        !player.folded &&
        !player.allIn &&
        player.roundBet < this.currentBet
      ) {
        this.pendingActions.add(player.userId);
      }
    }
  }

  public getAvailableSeat(): number {
    const occupiedSeats = new Set(this.players.map((player) => player.seat));

    for (let seat = 0; seat < this.maxPlayers; seat++) {
      if (!occupiedSeats.has(seat)) {
        return seat;
      }
    }

    throw new Error('Table is full');
  }
}
