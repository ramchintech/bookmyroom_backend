import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { DrawingService } from './drawing.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { UpdateDrawingDto } from './dto/update-drawing.dto';

@Controller('drawings')
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

  @Post()
  create(@Body() dto: CreateDrawingDto) {
    return this.drawingService.create(dto);
  }

  @Get('lodge/:lodgeId')
  findAll(@Param('lodgeId') lodgeId: string) {
    return this.drawingService.findAll(Number(lodgeId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drawingService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDrawingDto) {
    return this.drawingService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drawingService.remove(Number(id));
  }
}
