import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateFacilitatorDto } from './dto/create-facilitator.dto';
import { UpdateFacilitatorDto } from './dto/update-facilitator.dto';

const prisma = new PrismaClient();

@Injectable()
export class FacilitatorService {
  // ✅ Create new facilitator
  async create(dto: CreateFacilitatorDto) {
    return prisma.facilitator.create({
      data: dto,
      select: {
        id: true,
        lodge_id: true,
        facility: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
  }

  // ✅ Get all facilitators for a specific lodge
  async findAllByLodge(lodge_id: number) {
    const facilitators = await prisma.facilitator.findMany({
      where: { lodge_id },
      select: {
        id: true,
        lodge_id: true,
        facility: true,
        name: true,
        phone: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!facilitators.length)
      throw new NotFoundException(`No facilitators found for lodge ID ${lodge_id}`);
    return facilitators;
  }

  // ✅ Get a single facilitator by ID
  async findOne(id: number) {
    const facilitator = await prisma.facilitator.findUnique({
      where: { id },
      select: {
        id: true,
        lodge_id: true,
        facility: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
    if (!facilitator)
      throw new NotFoundException(`Facilitator with ID ${id} not found`);
    return facilitator;
  }

  // ✅ Update facilitator details
  async update(id: number, dto: UpdateFacilitatorDto) {
    await this.findOne(id); // ensure exists
    return prisma.facilitator.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        lodge_id: true,
        facility: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
  }

  // ✅ Delete facilitator
  async remove(id: number) {
    await this.findOne(id); // ensure exists
    await prisma.facilitator.delete({ where: { id } });
    return { message: `Facilitator with ID ${id} deleted successfully` };
  }
}
