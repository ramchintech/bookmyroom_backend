import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

const prisma = new PrismaClient();

@Injectable()
export class IncomeService {
  async create(dto: CreateIncomeDto) {
  return prisma.income.create({
    data: {
      ...dto,
      type: "INCOME",   //  ✅ force type always INCOME
    },
  });
}

  async findAll(lodge_id: number) {
    return prisma.income.findMany({
      where: { lodge_id,type: "INCOME",},
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllLodge(lodge_id: number) {
    return prisma.income.findMany({
      where: { lodge_id},
      orderBy: { created_at: 'desc' },
    });
  }
  async findOne(id: number) {
    const income = await prisma.income.findUnique({ where: { id } });
    if (!income) throw new NotFoundException(`Income ${id} not found`);
    return income;
  }

  async update(id: number, dto: UpdateIncomeDto) {
    await this.findOne(id);
    return prisma.income.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.income.delete({ where: { id } });
  }
}
