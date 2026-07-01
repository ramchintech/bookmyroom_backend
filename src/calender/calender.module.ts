import { Module } from '@nestjs/common';
import { CalenderController } from './calender.controller';
import { CalenderService } from './calender.service';

@Module({
  controllers: [CalenderController],
  providers: [CalenderService],
})
export class CalenderModule {}
