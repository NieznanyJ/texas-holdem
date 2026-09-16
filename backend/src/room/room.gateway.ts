import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { RoomService } from './room.service.js';
import type { GameState } from '../game/models/game-state.js';

@WebSocketGateway({
  cors: {
    origin: process.env.BASE_URL_FRONTEND,
  },
})
export class RoomGateway implements OnGatewayDisconnect {
  private readonly connections = new Map<
    string,
    { socket: Socket; userId: string; roomId: string }
  >();

  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('room:create')
  createRoom(@MessageBody() data: { name: string; userId: string }): {
    roomId: string;
  } {
    const room = this.roomService.createRoom(data.userId, data.name, 5, 10);
    return { roomId: room.id };
  }

  @SubscribeMessage('room:join')
  joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ): { success: boolean } {
    if (this.connections.has(client.id)) {
      throw new WsException('This connection has already joined a room');
    }
    this.roomService.joinRoom(data.roomId, data.userId, 1000);
    this.connections.set(client.id, {
      socket: client,
      userId: data.userId,
      roomId: data.roomId,
    });
    this.sendRoomState(data.roomId);
    return { success: true };
  }

  @SubscribeMessage('room:state')
  getState(@ConnectedSocket() client: Socket): GameState & { ownerId: string; viewerId: string } {
    const connection = this.getConnection(client);

    return this.roomService.getState(connection.roomId, connection.userId);
  }

  @SubscribeMessage('room:start')
  startHand(@ConnectedSocket() client: Socket): { success: boolean } {
    const connection = this.getConnection(client);
    this.roomService.startHand(connection.roomId, connection.userId);
    this.sendRoomState(connection.roomId);
    return { success: true };
  }

  @SubscribeMessage('game:fold')
  fold(@ConnectedSocket() client: Socket): { success: boolean; error?: string } {
    return this.performAction(client, (roomId, userId) => this.roomService.fold(roomId, userId));
  }

  @SubscribeMessage('game:check')
  check(@ConnectedSocket() client: Socket): { success: boolean; error?: string } {
    return this.performAction(client, (roomId, userId) => this.roomService.check(roomId, userId));
  }

  @SubscribeMessage('game:call')
  call(@ConnectedSocket() client: Socket): { success: boolean; error?: string } {
    return this.performAction(client, (roomId, userId) => this.roomService.call(roomId, userId));
  }

  @SubscribeMessage('game:bet')
  bet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { amount: number },
  ): { success: boolean; error?: string } {
    return this.performAction(client, (roomId, userId) => this.roomService.bet(roomId, userId, data?.amount));
  }

  @SubscribeMessage('game:raise')
  raise(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { amount: number },
  ): { success: boolean; error?: string } {
    return this.performAction(client, (roomId, userId) => this.roomService.raise(roomId, userId, data?.amount));
  }

  private performAction(client: Socket, action: (roomId: string, userId: string) => void): { success: boolean; error?: string } {
    try {
      const connection = this.getConnection(client);
      action(connection.roomId, connection.userId);
      this.sendRoomState(connection.roomId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Action failed' };
    }
  }

  handleDisconnect(client: Socket): void {
    this.connections.delete(client.id);
  }

  private getConnection(client: Socket) {
    const connection = this.connections.get(client.id);
    if (!connection) throw new WsException('Join a room first');
    return connection;
  }

  private sendRoomState(roomId: string): void {
    for (const connection of this.connections.values()) {
      if (connection.roomId !== roomId) continue;
      const state = this.roomService.getState(roomId, connection.userId);
      connection.socket.emit('game:updated', state);
    }
  }
}
