import { Module } from '@nestjs/common';
import { FacilitatorService } from './facilitator.service';
import { FacilitatorController } from './facilitator.controller';

@Module({
  controllers: [FacilitatorController],
  providers: [FacilitatorService],
})
export class FacilitatorModule {}
