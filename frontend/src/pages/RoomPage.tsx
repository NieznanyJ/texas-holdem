import GameActions from '../components/GameActions';
import Card from '../components/Card';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { socket } from '../lib/socket';
import type { RoomState } from '../game/models/game-state';

const Page = styled.main`
  min-height: 100svh; box-sizing: border-box; padding: clamp(20px, 4vw, 48px);
  background: #10251b; color: #f1f6f2; font-family: system-ui, sans-serif;
  h1, h2, h3, p { margin: 0; }
`;
const Content = styled.div`max-width: 1120px; margin: auto; display: grid; gap: 24px;`;
const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;
  h1 { font-size: clamp(28px, 4vw, 40px); margin-bottom: 8px; }
`;
const Muted = styled.p`color: #b5c9bc; line-height: 1.6; overflow-wrap: anywhere;`;
const Panel = styled.section`
  background: #193729; border: 1px solid #3c5b47; border-radius: 16px; padding: 24px;
  display: grid; gap: 16px;
`;
const Stats = styled.dl`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 20px; margin: 0;
  dt { color: #b5c9bc; font-size: 13px; margin-bottom: 6px; }
  dd { margin: 0; font-size: 22px; font-weight: 650; text-transform: capitalize; }
`;
const Cards = styled.div`display: flex; flex-wrap: wrap; gap: 10px;`;
const Players = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px;
`;
const Seat = styled.article<{ $active: boolean }>`
  padding: 20px; border-radius: 12px; display: grid; gap: 12px; min-width: 0;
  background: #142e22; border: 2px solid ${p => p.$active ? '#d4af37' : '#365442'};
  h3 { font-size: 18px; }
`;
const Badge = styled.span`
  display: inline-block; width: fit-content; padding: 5px 10px; border-radius: 20px;
  background: #304e3d; color: #e6d58e; font-size: 13px;
`;
const Button = styled.button`
  padding: 13px 22px; border: 0; border-radius: 8px; font: inherit; font-weight: 700;
  background: #d4af37; color: #171717; cursor: pointer;
  &:hover:not(:disabled) { background: #e8c54a; }
  &:disabled { opacity: .5; cursor: not-allowed; }
  &:focus-visible { outline: 3px solid white; outline-offset: 3px; }
`;
const ErrorBox = styled.p`
  padding: 16px; border: 1px solid #ad6666; border-radius: 10px; color: #ffcbcb; background: #432a2a;
`;
function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [game, setGame] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [isStarting, setIsStarting] = useState(false);
  const starting = useRef(false);
  const userId = game && game.id === roomId ? game.viewerId : null;

  useEffect(() => {
    let active = true;
    let receivedUpdate = false;
    setGame(null);
    setError(null);

    const handleUpdate = (state: RoomState) => {
      if (active && state.id === roomId) {
        receivedUpdate = true;
        setGame(state);
        setError(null);
      }
    };
    const onDisconnect = () => {
      setConnected(false);
      setError('Connection lost. Returning to the room after reconnect is not supported yet.');
    };
    const onConnect = () => {
      setConnected(true);
      setError('Connection restored. Your room session must be restored before you can play.');
    };
    socket.on('game:updated', handleUpdate);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);

    if (!socket.connected) {
      setError('Not connected. Join the room from the lobby first.');
    } else {
      socket.timeout(5000).emitWithAck('room:state')
        .then((state: RoomState) => {
          // Do not overwrite a newer pushed update with the initial snapshot.
          if (!receivedUpdate) handleUpdate(state);
        })
        .catch(() => {
          if (active && !receivedUpdate) setError('Unable to load the room. Join from the lobby first.');
        });
    }

    return () => {
      active = false;
      socket.off('game:updated', handleUpdate);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, [roomId]);

  const currentGame = game?.id === roomId ? game : null;
  const canStart = Boolean(currentGame && connected &&
    currentGame.ownerId === userId &&
    ['waiting', 'finished'].includes(currentGame.phase) &&
    currentGame.players.filter(p => p.chips > 0).length >= 2);

  async function startHand(): Promise<void> {
    if (!canStart || starting.current) return;
    starting.current = true;
    setIsStarting(true);
    setError(null);
    try {
      const response: { success: boolean } = await socket.timeout(5000).emitWithAck('room:start');
      if (!response.success) throw new Error('Start failed');
    } catch {
      setError('Unable to start the hand or the server did not respond.');
    } finally {
      starting.current = false;
      setIsStarting(false);
    }
  }

  if (!currentGame) return (
    <Page><Content><h1>Poker Room</h1>
      {error ? <ErrorBox role="alert">{error}</ErrorBox> : <Muted role="status">Loading room...</Muted>}
    </Content></Page>
  );

  const room = currentGame;
  const betweenHands = room.phase === 'waiting' || room.phase === 'finished';
  return (
    <Page><Content>
      <Header>
        <div><h1>Poker Room</h1><Muted>Room ID: {roomId}</Muted></div>
        <Badge role="status">{connected ? 'Connected' : 'Disconnected'}</Badge>
      </Header>
      {error && <ErrorBox role="alert">{error}</ErrorBox>}
      <Panel aria-label="Table information">
        <Stats>
          <div><dt>Phase</dt><dd>{room.phase}</dd></div>
          <div><dt>Hand</dt><dd>#{room.handNumber}</dd></div>
          <div><dt>Blinds</dt><dd>{room.smallBlind} / {room.bigBlind}</dd></div>
          <div><dt>Pot</dt><dd>{room.pot}</dd></div>
          <div><dt>Current bet</dt><dd>{room.currentBet}</dd></div>
        </Stats>
      </Panel>
      {betweenHands && <Panel>
        <h2>{room.phase === 'waiting' ? 'Ready to play?' : 'Next hand'}</h2>
        <Muted>{room.players.filter(p => p.chips > 0).length < 2
          ? 'At least two players with chips are needed.'
          : room.ownerId === userId ? 'Your table is ready. Start when everyone is here.'
            : 'Waiting for the owner to start the hand.'}</Muted>
        {room.ownerId === userId && <Button type="button" onClick={startHand}
          disabled={!canStart || isStarting}>{isStarting ? 'Starting...' : 'Start hand'}</Button>}
      </Panel>}
      <Panel>
        <h2>Community cards</h2>
        {room.communityCards.length === 0 ? <Muted>No cards on the board yet.</Muted>
          : <Cards >{room.communityCards.map(card => <Card testId='card' key={card.rank + card.suit} card={card} />)}</Cards>}
      </Panel>
      <GameActions key={room.id + room.handNumber + room.phase + room.currentPlayerSeat} game={room} userId={userId} connected={connected} />
      <section aria-labelledby="players-heading">
        <h2 id="players-heading">Players ({room.players.length}/{room.maxPlayers})</h2>
        <Players>
          {room.players.map(player => <Seat key={player.userId} $active={player.seat === room.currentPlayerSeat}>
            <h3>Seat {player.seat + 1}{player.userId === userId ? ' · You' : ''}</h3>
            <Muted>{player.userId}</Muted>
            {player.seat === room.currentPlayerSeat && <Badge>{player.userId === userId ? 'Your turn' : 'To act'}</Badge>}
            <p>Chips: <strong>{player.chips}</strong> · Bet: {player.roundBet}</p>
            <Muted>{[player.seat === room.dealerSeat && 'Dealer',
            player.seat === room.smallBlindSeat && 'Small blind',
            player.seat === room.bigBlindSeat && 'Big blind',
            player.folded && 'Folded', player.allIn && 'All-in',
            !player.inHand && (room.phase === 'waiting' ? 'Waiting' : 'Sitting out')].filter(Boolean).join(' · ')}</Muted>
            <Cards>{player.cardCount === 0 ? <Muted>Cards not dealt</Muted>
              : player.hand === null
                ? Array.from({ length: player.cardCount }, (_, index) => <Card key={index} hidden />)
                : player.hand.map(card => <Card testId='card' key={card.rank + card.suit} card={card} />)}</Cards>
          </Seat>)}
        </Players>
      </section>
      {room.result && <Panel>
        <h2>Hand result</h2>
        <Muted>{room.result.reason === 'showdown' ? 'Showdown' : 'All other players folded'}</Muted>
        {room.result.pots.map((pot, index) => <div key={index}>
          <h3>{pot.kind === 'refund' ? 'Uncalled bet returned' : 'Pot payout'} · {pot.amount}</h3>
          {pot.awards.map(award => <Muted key={award.userId}>
            {award.userId === userId ? 'You' : award.userId}: +{award.amount} chips
          </Muted>)}
        </div>)}
      </Panel>}
    </Content></Page>
  );
}

export default RoomPage;
