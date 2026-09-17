# Requirements

## Authentication

AUTH-01 User can register.
AUTH-02 User can log in.
AUTH-03 Invalid credentials return an error.
AUTH-04 Session persists after refresh.

## Lobby

LOB-01 User can see available rooms.
LOB-02 User can create a room.
LOB-03 User can join a room.
LOB-04 Room list updates in real time.

## Game

GAME-01 Server is authoritative for game state.
GAME-02 Players receive private cards.
GAME-03 Community cards are visible to all players.
GAME-04 Player can fold, check, call or raise when allowed.
GAME-05 Invalid actions are rejected by the server.
GAME-06 Players can use in game chat to communicate with each other
## Complete heads-up hand and next hand

Scope: two players complete one hand and can start another when both remain eligible. These requirements describe expected behavior, not verified implementation or test coverage.

### GAME-07 Betting rounds advance correctly

- A hand progresses through preflop, flop, turn and river while at least two players remain in the hand.
- The board contains zero cards preflop, three on the flop, four on the turn and five on the river.
- A betting round ends only when all required actions are complete and outstanding bets are matched, except for players who are all-in.
- In heads-up play, the dealer posts the small blind and acts first preflop; the other player acts first after the flop when able to act.

### GAME-08 Folding ends the hand when one player remains

- When one player folds in heads-up play, the remaining player receives the pot without a showdown.
- The hand finishes and no further betting action is accepted for that hand.
- The hand does not reveal private cards solely because an opponent folded.

### GAME-09 Showdown determines the winner

- After river betting ends with both players still in the hand, the server compares their best five-card hands formed from their two hole cards and the five community cards.
- The highest-ranking hand wins; equal hands share the contested pot.
- Both participating hands are revealed at showdown, and both clients receive the same public result.

### GAME-10 Settlement preserves chips

- Each contribution is deducted from a player's stack exactly once and accounted for in the pot.
- Uncalled excess contributions are returned to the contributing player and are not treated as winnings from a contested pot.
- Awards and refunds account for the entire pot; settlement leaves the live pot at zero and cannot pay the same hand twice.
- With no players joining or leaving and no chip purchases, total chips across stacks and the live pot remain constant.
- For a tied pot, awards are equal except for an indivisible odd chip, which goes to the first tied winner clockwise after the dealer.

### GAME-11 A called all-in completes the remaining board

- An all-in player remains eligible to win but is not asked to take further betting actions.
- A player facing an all-in bet still gets their required decision before the board advances.
- Once no further betting decisions are possible, the server deals the remaining community cards and settles the hand automatically.
- Unequal stacks are handled by returning any unmatched contribution before awarding the contested pot.

### GAME-12 The next hand starts from a clean state

- A new hand starts only after the previous hand has been settled and at least two eligible players have chips.
- The hand number increases and the dealer moves to the next eligible player; in heads-up play the blind positions switch.
- Previous hole cards, community cards, contributions, folded/all-in flags and pending actions are cleared for the new hand.
- Settled stack balances are preserved; new blinds are deducted from those balances.
- A fresh complete deck is shuffled, two private cards are dealt to each participant, and preflop action starts with the correct player.
- If fewer than two eligible players remain, starting another hand is rejected without changing settled balances.

### GAME-13 Both clients observe consistent hand progress

- After each accepted action, both clients converge on the same public phase, board, pot, stacks and current player.
- Each client receives only the private cards they are entitled to see until showdown.
- Both clients observe the settled result and the subsequent hand without a manual page refresh.
