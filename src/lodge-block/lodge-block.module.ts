import { Module } from '@nestjs/common';
import { LodgeBlockService } from './lodge-block.service';
import { LodgeBlockController } from './lodge-block.controller';

@Module({
  controllers: [LodgeBlockController],
  providers: [LodgeBlockService],
})
export class LodgeBlockModule {}
