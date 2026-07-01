import { Module } from '@nestjs/common';
import { PeakHoursService } from './peak-hour.service';
import { PeakHoursController } from './peak-hour.controller';

@Module({
  controllers: [PeakHoursController],
  providers: [PeakHoursService],
})
export class PeakHoursModule {}
