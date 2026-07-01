import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { CancelService } from './cancel.service';
import { CalculateCancelDto } from './dto/calculate.dto';
import { CreateCancelDto } from './dto/create-cancel.dto';
import { PartialCancelDto } from './dto/partial-cancel.dto';

@Controller('cancels')
export class CancelController {
  constructor(private readonly cancelService: CancelService) {}

  @Post('partial')
async partialCancel(@Body() dto: PartialCancelDto) {
  return this.cancelService.partialCancel(dto);
}

  @Post()
  async createCancel(@Body() dto: CreateCancelDto) {
    return this.cancelService.createCancel(dto);
  }
  
  @Get('prebooked/:lodgeId')
async getPreBooked(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.cancelService.getPreBookedData(lodgeId);
}

@Post('cancel-price')
  async calculateCancel(@Body() dto: CalculateCancelDto) {
    return this.cancelService.calculateCancelCharge(dto);
  }

  @Get()
  findAll() {
    return this.cancelService.findAll();
  }


  // 🔹 2️⃣ Get cancellations for a specific lodge
  @Get('lodge/:lodge_id')
  findByLodgeId(@Param('lodge_id', ParseIntPipe) lodge_id: number) {
    return this.cancelService.findByLodgeId(lodge_id);
  }

  // 🔹 3️⃣ Get one cancellation by booking_id + lodge_id
  // @Get(':booking_id/:lodge_id')
  // findOne(
  //   @Param('booking_id', ParseIntPipe) booking_id: number,
  //   @Param('lodge_id', ParseIntPipe) lodge_id: number,
  // ) {
  //   return this.cancelService.findOne(booking_id, lodge_id);
  // }
}
