import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expenseService.create(dto);
  }
  
  @Get('all/:lodgeId')
  findAllLodge(@Param('lodgeId') lodgeId: string) {
    return this.expenseService.findAllLodge(Number(lodgeId));
  }

  @Get('lodge/:lodgeId')
  findAll(@Param('lodgeId') lodgeId: string) {
    return this.expenseService.findAll(Number(lodgeId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(Number(id));
  }
}
