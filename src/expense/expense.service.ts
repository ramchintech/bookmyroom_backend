import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const prisma = new PrismaClient();

@Injectable()
export class ExpenseService {

  async create(dto: CreateExpenseDto) {
    return prisma.expense.create({ 
  data: { ...dto, type: "EXPENSE" },
});
  }

  async findAll(lodge_id: number) {
    return prisma.expense.findMany({
      where: { lodge_id ,type:"EXPENSE"},
      orderBy: { created_at: 'desc' },
    });
  }
  async findAllLodge(lodge_id: number) {
    return prisma.expense.findMany({
      where: { lodge_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.expense.delete({ where: { id } });
  }
}
