import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { GameModule } from './game/game.module.js';
import { RoomModule } from './room/room.module.js';

@Module({
  imports: [UserModule, GameModule, RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
