import { Module } from '@nestjs/common';
import { GameController } from './game.controller.js';
import { GameService } from './game.service.js';

@Module({
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule {}
