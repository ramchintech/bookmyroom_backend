import { Body, Controller, Get, Post, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PeakHoursService } from './peak-hour.service';
import { CreatePeakHourDto } from './dto/create-peak-hour.dto';

@Controller('peak-hours')
export class PeakHoursController {
  constructor(private readonly peakHoursService: PeakHoursService) {}

  // GET /peak-hours/lodge/:lodgeId → all peak hours for a lodge
  @Get(':lodgeId')
  findAllByLodge(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.peakHoursService.findAllByLodge(lodgeId);
  }

  // POST /peak-hours → create a new peak hour
  @Post()
  create(@Body() dto: CreatePeakHourDto) {
    return this.peakHoursService.create(dto);
  }

  // GET /peak-hours/lodge/:lodgeId/:date → specific peak hour by date
  @Get('lodge/:lodgeId/:date')
  findByLodgeAndDate(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('date') date: string,
  ) {
    return this.peakHoursService.findByLodgeAndDate(lodgeId, date);
  }

  // DELETE /peak-hours/lodge/:lodgeId/:id → delete a specific peak hour
  @Delete('lodge/:lodgeId/:id')
  delete(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.peakHoursService.delete(lodgeId, id);
  }
}
