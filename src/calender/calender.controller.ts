import { Controller, Get, Param, Query, ParseIntPipe, Post, Body, HttpCode } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { CalculatePricingDto } from './dto/calculate-pricing.dto';
import{UpdatePricingDto} from './dto/update-pricing.dto';

@Controller('calendar')
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  // ✔ Get available rooms
  @Get('available-rooms/:lodgeId')
  async getAvailableRooms(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Query('check_in') check_in: string,
    @Query('check_out') check_out: string,
  ) {
    return this.calenderService.getAvailableRooms(
      lodgeId,
      new Date(check_in),
      new Date(check_out),
    );
  }

  // ✔ Calculate pricing
  @Post('calculate-pricing')
  @HttpCode(200)                   // <- force 200 instead of default 201
  async calculate(@Body() dto: CalculatePricingDto) {
    return this.calenderService.calculateRoomPrice(dto);
  }


  @Post("update-pricing")
  @HttpCode(200)                   // <- force 200 instead of default 201
  async updatePricing(@Body() dto: UpdatePricingDto) {
    return this.calenderService.updatePricing(dto);
  }

}
