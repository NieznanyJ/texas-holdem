import { Card, Rank } from './card.js';

export interface HandValue {
  /** Higher category and then higher kickers win. */
  category: number;
  kickers: number[];
}

const ranks = Object.values(Rank);

export function compareHands(a: HandValue, b: HandValue): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < a.kickers.length; i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}

function evaluateFive(cards: readonly Card[]): HandValue {
  const values = cards
    .map((card) => ranks.indexOf(card.rank) + 2)
    .sort((a, b) => b - a);
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const unique = [...counts.keys()];
  const straight =
    unique.length === 5
      ? values[0] - values[4] === 4
        ? values[0]
        : values.join(',') === '14,5,4,3,2'
          ? 5
          : 0
      : 0;
  if (flush && straight) return { category: 8, kickers: [straight] };
  if (groups[0][1] === 4)
    return { category: 7, kickers: groups.map((g) => g[0]) };
  if (groups[0][1] === 3 && groups[1][1] === 2)
    return { category: 6, kickers: groups.map((g) => g[0]) };
  if (flush) return { category: 5, kickers: values };
  if (straight) return { category: 4, kickers: [straight] };
  if (groups[0][1] === 3)
    return { category: 3, kickers: groups.map((g) => g[0]) };
  if (groups[0][1] === 2 && groups[1][1] === 2)
    return { category: 2, kickers: groups.map((g) => g[0]) };
  if (groups[0][1] === 2)
    return { category: 1, kickers: groups.map((g) => g[0]) };
  return { category: 0, kickers: values };
}

/** Select the best five-card combination from five to seven cards. */
export function evaluateHand(cards: readonly Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7)
    throw new Error('Expected five to seven cards');
  if (
    new Set(cards.map((card) => card.suit + ':' + card.rank)).size !==
    cards.length
  ) {
    throw new Error('Duplicate cards');
  }
  let best: HandValue | undefined;
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const value = evaluateFive([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ]);
            if (!best || compareHands(value, best) > 0) best = value;
          }
  return best!;
}
