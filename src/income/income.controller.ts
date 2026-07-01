import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Body() dto: CreateIncomeDto) {
    return this.incomeService.create(dto);
  }

  @Get('lodge/:lodgeId')
  findAll(@Param('lodgeId') lodgeId: string) {
    return this.incomeService.findAll(Number(lodgeId));
  }
  @Get('all/:lodgeId')
  findAllLodge(@Param('lodgeId') lodgeId: string) {
    return this.incomeService.findAllLodge(Number(lodgeId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomeService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.incomeService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomeService.remove(Number(id));
  }
}
