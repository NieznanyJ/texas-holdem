import { Module } from '@nestjs/common';
import { RoomService } from './room.service.js';
import { RoomGateway } from './room.gateway.js';

@Module({
  providers: [RoomService, RoomGateway]
})
export class RoomModule {}
