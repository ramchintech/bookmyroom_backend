import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LodgeBlockService {
  // 1️⃣ Fetch all lodge blocks
  async findAll() {
    const blocks = await prisma.lodgeBlock.findMany({
      select: {
        id: true,
        lodge_id: true,
        reason: true,
        lodge: {
          select: {
            name: true,
            address: true,
            is_active: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    if (!blocks.length) throw new NotFoundException('No lodge blocks found');
    return blocks;
  }

  // 2️⃣ Fetch block(s) by lodge_id
  async findByLodge(lodgeId: number) {
    const blocks = await prisma.lodgeBlock.findMany({
      where: { lodge_id: lodgeId },
      select: {
        id: true,
        lodge_id: true,
        reason: true,
        lodge: {
          select: {
            name: true,
            address: true,
            is_active: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    if (!blocks.length)
      throw new NotFoundException(`No block entries found for lodge ID ${lodgeId}`);

    return blocks;
  }
}
