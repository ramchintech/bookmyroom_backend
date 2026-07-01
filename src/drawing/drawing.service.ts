import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { UpdateDrawingDto } from './dto/update-drawing.dto';

const prisma = new PrismaClient();

@Injectable()
export class DrawingService {
  async create(dto: CreateDrawingDto) {
    return prisma.drawing.create({ data: dto });
  }

  async findAll(lodge_id: number) {
    return prisma.drawing.findMany({
      where: { lodge_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const drawing = await prisma.drawing.findUnique({ where: { id } });
    if (!drawing) throw new NotFoundException(`Drawing ${id} not found`);
    return drawing;
  }

  async update(id: number, dto: UpdateDrawingDto) {
    await this.findOne(id);
    return prisma.drawing.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.drawing.delete({ where: { id } });
  }
}
