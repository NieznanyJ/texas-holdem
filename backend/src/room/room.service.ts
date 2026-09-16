import { Injectable } from '@nestjs/common';
import { Room } from './models/room.js';
import { randomUUID } from 'node:crypto';
import { Player } from '../game/models/player.js';
import { GameState } from '../game/models/game-state.js';

@Injectable()
export class RoomService {
  private readonly rooms = new Map<string, Room>();

  public createRoom(
    ownerId: string,
    name: string,
    smallBlind: number,
    bigBlind: number,
    maxPlayers: number = 9,
  ): Room {
    const roomName = name.trim();

    if (!roomName) {
      throw new Error('Room name cannot be empty');
    }

    const room = new Room(
      randomUUID(),
      roomName,
      ownerId,
      smallBlind,
      bigBlind,
      maxPlayers,
    );

    this.rooms.set(room.id, room);

    return room;
  }

  public getRoom(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with id ${roomId} not found`);
    }
    return room;
  }

  public listRooms(): Room[] {
    return [...this.rooms.values()];
  }

  public joinRoom(roomId: string, userId: string, chips: number): void {
    const room = this.getRoom(roomId);
    const seat = room.game.getAvailableSeat();
    const player = new Player(userId, seat, chips);

    room.game.addPlayer(player);
  }

  public leaveRoom(roomId: string, userId: string): void {
    const room = this.getRoom(roomId);
    room.game.removePlayer(userId);
  }

  public startHand(roomId: string, userId: string): void {
    const room = this.getRoom(roomId);

    if (room.ownerId !== userId) {
      throw new Error('Only the room owner can start a hand');
    }

    room.game.startHand();
  }

  public getState(
    roomId: string,
    userId: string,
  ): GameState & { ownerId: string; viewerId: string } {
    const room = this.getRoom(roomId);

    return {
      ...room.game.getStateForPlayer(userId),
      ownerId: room.ownerId,
      viewerId: userId,
    };
  }

  public fold(roomId: string, userId: string): void {
    this.getRoom(roomId).game.fold(userId);
  }

  public check(roomId: string, userId: string): void {
    this.getRoom(roomId).game.check(userId);
  }

  public call(roomId: string, userId: string): void {
    this.getRoom(roomId).game.call(userId);
  }

  public bet(roomId: string, userId: string, amount: number): void {
    this.getRoom(roomId).game.bet(userId, amount);
  }

  public raise(roomId: string, userId: string, amount: number): void {
    this.getRoom(roomId).game.raise(userId, amount);
  }
}
