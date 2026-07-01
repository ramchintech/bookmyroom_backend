import { Controller, Get, Post, Patch, Body, Param, Query,Delete } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CreateChargesDto } from './dto/create-charge.dto';
import { UpdateChargesDto } from './dto/update-charge.dto';

@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  // Create charge
  @Post()
  create(@Body() dto: CreateChargesDto) {
    return this.chargesService.create(dto);
  }

  @Get('check')
checkBooking(
  @Query('booking_id') booking_id: string,
  @Query('lodge_id') lodge_id: string,
) {
  return this.chargesService.checkBookingIsBooked(
    Number(booking_id),
    Number(lodge_id),
  );
}


  // Update charge by id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChargesDto) {
    return this.chargesService.update(Number(id), dto);
  }

  // Get all charges for a lodge
  @Get('lodge/:lodge_id')
  findAllByLodge(@Param('lodge_id') lodge_id: string) {
    return this.chargesService.findAllByLodge(Number(lodge_id));
  }

  // Get charges grouped by booking id
  @Get('lodge/:lodge_id/grouped')
  findGroupedByBooking(@Param('lodge_id') lodge_id: string) {
    return this.chargesService.findGroupedByBooking(Number(lodge_id));
  }

  // Get charge by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargesService.findOne(Number(id));
  }
  @Delete(':id')
 remove(@Param('id') id: string) {
 return this.chargesService.remove(Number(id));
}

}
