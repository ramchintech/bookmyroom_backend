import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingDto } from './dto/create-billing.dto';

@Controller('billings')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}
  
 @Post()
  async billingHandler(@Body() dto: BillingDto) {
    return this.billingService.createBillingAndUpdateStatus(
      dto.lodge_id,
      dto.user_id,
      dto.booking_id,
      dto.reason,
      dto.total,
      dto.balancePayment,
      dto.payment_method,
      dto.current_time,   // <-- Send to service
    );
  }

  @Get('charges/:bookingId')
  async getCharges(@Param('bookingId', ParseIntPipe) bookingId: number) {
    const charges = await this.billingService.getChargesByBookingId(bookingId);
    return {
      bookingId,
      charges, 
    };
  }

  @Get()
  findAll() {
    return this.billingService.findAll();
  }

  @Get('booked/:lodgeId')
  async getBooked(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
) {
  return this.billingService.getBookedData(lodgeId);
  }

  @Get('lodge/:lodge_id')
  findByLodgeId(@Param('lodge_id', ParseIntPipe) lodge_id: number) {
    return this.billingService.findByLodgeId(lodge_id);
  }

  @Get(':booking_id/:lodge_id')
  findOne(
    @Param('booking_id', ParseIntPipe) booking_id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
  ) {
    return this.billingService.findOne(booking_id, lodge_id);
  }

}
