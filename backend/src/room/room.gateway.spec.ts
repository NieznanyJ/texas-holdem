import { RoomGateway } from './room.gateway.js';
import { RoomService } from './room.service.js';
import type { Socket } from 'socket.io';

describe('RoomGateway actions', () => {
  it('plays a hand and acknowledges illegal moves without changing state', () => {
    const service = new RoomService();
    const gateway = new RoomGateway(service);
    const first = { id: 'socket-1', emit: vi.fn() } as unknown as Socket;
    const second = { id: 'socket-2', emit: vi.fn() } as unknown as Socket;
    const { roomId } = gateway.createRoom({ name: 'Test', userId: 'a' });
    gateway.joinRoom(first, {roomId, userId: 'a'});
    gateway.joinRoom(second, {roomId, userId: 'b'});
    expect(gateway.getState(first).viewerId).toBe('a');
    expect(gateway.getState(second).viewerId).toBe('b');
    gateway.startHand(first);
    expect(gateway.check(first).success).toBe(false);
    expect(gateway.call(first).success).toBe(true);
    expect(gateway.check(second).success).toBe(true);
    expect(gateway.bet(second, {amount: 20}).success).toBe(true);
    expect(gateway.raise(first, {amount: 40}).success).toBe(true);
    expect(gateway.call(second).success).toBe(true);
    expect(gateway.fold(second).success).toBe(true);
    expect(gateway.getState(first).phase).toBe('finished');
    expect(first.emit).toHaveBeenCalledWith('game:updated', expect.objectContaining({phase:'finished'}));
    expect(second.emit).toHaveBeenCalledWith('game:updated', expect.objectContaining({phase:'finished'}));
    expect(gateway.fold(first).success).toBe(false);
  });

  it('returns an error acknowledgement for a socket that has not joined', () => {
    const gateway = new RoomGateway(new RoomService());
    const client = {id:'unknown'} as Socket;
    expect(gateway.call(client)).toEqual({success:false, error:'Join a room first'});
  });
});
