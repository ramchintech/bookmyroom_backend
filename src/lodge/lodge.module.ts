import { Module } from '@nestjs/common';
import { LodgeService } from './lodge.service';
import { LodgeController } from './lodge.controller';

@Module({
  controllers: [LodgeController],
  providers: [LodgeService],
})
export class LodgeModule {}
