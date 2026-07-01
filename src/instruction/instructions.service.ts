import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateInstructionDto } from './dto/create-instruction.dto';
import { UpdateInstructionDto } from './dto/update-instruction.dto';

const prisma = new PrismaClient();

@Injectable()
export class InstructionsService {
  async findAllByHall(lodgeId: number) {
    return prisma.instruction.findMany({
      where: { lodge_id: lodgeId },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(instructionId: number) {
    const instruction = await prisma.instruction.findUnique({
      where: { id: instructionId },
    });
    if (!instruction) throw new NotFoundException(`Instruction ID ${instructionId} not found`);
    return instruction;
  }

  // Single create
  async create(dto: CreateInstructionDto) {
    return prisma.instruction.create({
      data: {
        lodge_id: dto.lodge_id,
        instruction: dto.instruction.trim(),
      },
    });
  }

  // Multiple create
  async createMany(dtos: CreateInstructionDto[]) {
    const data = dtos.map(dto => ({
      lodge_id: dto.lodge_id,
      instruction: dto.instruction.trim(),
    }));

    const result = await prisma.instruction.createMany({
      data,
      skipDuplicates: true, // avoid duplicates if same instruction
    });

    return { count: result.count };
  }

  async update(instructionId: number, dto: UpdateInstructionDto) {
    const instruction = await prisma.instruction.findUnique({ where: { id: instructionId } });
    if (!instruction || instruction.lodge_id !== dto.lodge_id) {
      throw new NotFoundException(`Instruction ID ${instructionId} not found for lodge ${dto.lodge_id}`);
    }

    return prisma.instruction.update({
      where: { id: instructionId },
      data: { instruction: dto.instruction?.trim() },
    });
  }

  async remove(instructionId: number, lodgeId: number) {
    const instruction = await prisma.instruction.findUnique({ where: { id: instructionId } });
    if (!instruction || instruction.lodge_id !== lodgeId) {
      throw new NotFoundException(`Instruction ID ${instructionId} not found for lodge ${lodgeId}`);
    }

    return prisma.instruction.delete({ where: { id: instructionId } });
  }
}
