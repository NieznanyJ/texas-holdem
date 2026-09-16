import { useRef, useState } from 'react';
import styled from 'styled-components';
import { socket } from '../lib/socket';
import type { RoomState } from '../game/models/game-state';

const Panel = styled.section`
  display: grid; gap: 16px; padding: 24px; border: 1px solid #d4af37;
  border-radius: 16px; background: #193729;
`;
const Row = styled.div`display: flex; flex-wrap: wrap; gap: 12px; align-items: end;`;
const Button = styled.button`
  padding: 12px 20px; border: 1px solid #d4af37; border-radius: 8px;
  background: #d4af37; color: #171717; font: inherit; cursor: pointer;
  &:disabled { opacity: .45; cursor: not-allowed; }
  &:focus-visible { outline: 3px solid white; outline-offset: 3px; }
`;
const Label = styled.label`
  display: grid; gap: 8px;
  input { width: 160px; padding: 12px; background: #10251b; color: white;
    border: 1px solid #799583; border-radius: 8px; font: inherit; }
`;

export default function GameActions({ game, userId, connected }: {
  game: RoomState; userId: string | null; connected: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const player = game.players.find(p => p.userId === userId);
  const betting = ['preflop', 'flop', 'turn', 'river'].includes(game.phase);
  if (!player || !betting) return null;
  const turn = player.inHand && !player.folded && !player.allIn && player.seat === game.currentPlayerSeat;
  const disabled = !connected || !turn || pending;
  const toCall = Math.max(0, game.currentBet - player.roundBet);
  const max = player.roundBet + player.chips;
  const minimum = game.currentBet === 0 ? game.bigBlind : game.currentBet + game.minRaise;
  const target = amount === '' ? Math.min(minimum, max) : Number(amount);
  const canIncrease = game.canRaise;
  const valid = Number.isSafeInteger(target) && target > game.currentBet &&
    target <= max && (target >= minimum || target === max);

  async function act(event: string, value?: number) {
    if (disabled || busy.current || !socket.connected) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const response: { success: boolean; error?: string } = value === undefined
        ? await socket.timeout(5000).emitWithAck(event)
        : await socket.timeout(5000).emitWithAck(event, { amount: value });
      if (!response.success) throw new Error(response.error ?? 'Action rejected.');
      setAmount('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return <Panel aria-label="Player actions" aria-busy={pending}>
    <h2>{turn ? 'Your turn' : player.folded ? 'You folded' : player.allIn ? 'You are all-in' : 'Waiting for your turn'}</h2>
    <p>Stack: {player.chips} chips · To call: {Math.min(toCall, player.chips)}</p>
    <Row>
      <Button disabled={disabled} onClick={() => void act('game:fold')}>Fold</Button>
      {toCall === 0
        ? <Button disabled={disabled} onClick={() => void act('game:check')}>Check</Button>
        : <Button disabled={disabled} onClick={() => void act('game:call')}>
            Call {Math.min(toCall, player.chips)}{toCall >= player.chips ? ' (all-in)' : ''}
          </Button>}
    </Row>
    {canIncrease && <Row>
      <Label>{game.currentBet === 0 ? 'Bet amount' : 'Raise to'}
        <input type="number" step="1" min={Math.min(minimum, max)} max={max}
          value={amount === '' ? Math.min(minimum, max) : amount}
          onChange={event => setAmount(event.target.value)} disabled={disabled} />
      </Label>
      <Button disabled={disabled || !valid}
        onClick={() => void act(game.currentBet === 0 ? 'game:bet' : 'game:raise', target)}>
        {game.currentBet === 0 ? 'Bet' : 'Raise to'} {Number.isFinite(target) ? target : ''}
      </Button>
      <Button disabled={disabled || max <= game.currentBet}
        onClick={() => void act(game.currentBet === 0 ? 'game:bet' : 'game:raise', max)}>
        All-in {player.chips}
      </Button>
    </Row>}
    {error && <p role="alert">{error}</p>}
  </Panel>;
}
