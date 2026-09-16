export interface CardState {
    suit: "clubs" | "diamonds" | "hearts" | "spades";
    rank:
        | "2"
        | "3"
        | "4"
        | "5"
        | "6"
        | "7"
        | "8"
        | "9"
        | "10"
        | "J"
        | "Q"
        | "K"
        | "A";
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
    hand: CardState[] | null;
}

export interface PotResult {
    amount: number;
    kind: "pot" | "refund";
    eligibleUserIds: string[];
    awards: { userId: string; amount: number }[];
}

export interface HandResult {
    reason: "showdown" | "fold";
    pots: PotResult[];
}

export interface GameState {
    id: string;
    handNumber: number;
    phase:
        | "waiting"
        | "preflop"
        | "flop"
        | "turn"
        | "river"
        | "showdown"
        | "finished";
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

export interface RoomState extends GameState {
    viewerId: string;
    ownerId: string;
}
