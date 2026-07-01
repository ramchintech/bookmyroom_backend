import { Module } from '@nestjs/common';
import { RoomsService } from './room.service';
import { RoomsController } from './room.controller';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
