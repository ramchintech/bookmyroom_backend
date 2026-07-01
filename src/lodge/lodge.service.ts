import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLodgeDto } from './dto/create-lodge.dto';
import { UpdateLodgeDto } from './dto/update-lodge.dto';

const prisma = new PrismaClient();

@Injectable()
export class LodgeService {
  // Convert lodge logo buffer to base64
  private toBase64(lodge: any) {
    if (lodge?.logo) {
      const buffer =
        lodge.logo instanceof Buffer
          ? lodge.logo
          : Buffer.from(Object.values(lodge.logo));
      return {
        ...lodge,
        logo: buffer.toString('base64'),
      };
    }
    return lodge;
  }

  // Get all lodges
  async findAll() {
    const lodges = await prisma.lodge.findMany({
      where: { lodge_id: { not: 0 } },
      select: {
        lodge_id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        logo: true,
        duedate: true,
        is_active: true,
      },
    });

    return lodges.map(this.toBase64);
  }

  // Get single lodge by id (including block reasons)
  async findOne(id: number) {
    const lodge = await prisma.lodge.findUnique({
      where: { lodge_id: id },
      include: {
        blocks: { select: { reason: true } },
      },
    });

    if (!lodge) throw new NotFoundException(`Lodge with ID ${id} not found`);

    const lodgeWithBase64 = this.toBase64(lodge);
    const blockReasons = lodge.blocks.map(b => b.reason);

    return {
      ...lodgeWithBase64,
      block_reasons: blockReasons,
    };
  }

  // Create lodge
  async createLodge(createLodgeDto: CreateLodgeDto) {
    const { lodge_id, name, phone, email, address, logo } = createLodgeDto;
    const logoBuffer = logo ? Buffer.from(logo, 'base64') : undefined;

    const now = new Date();
    const duedate = new Date(now);
    duedate.setMonth(duedate.getMonth() + 2);

    const lodge = await prisma.lodge.create({
      data: {
        lodge_id,
        name,
        phone,
        email,
        address,
        logo: logoBuffer,
        duedate,
      },
    });

    return this.toBase64(lodge);
  }

  // Update lodge
  async updateLodge(id: number, updateLodgeDto: UpdateLodgeDto) {
    const { name, phone, email, address, logo, duedate } = updateLodgeDto;

    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: id } });
    if (!lodge) throw new NotFoundException(`Lodge with ID ${id} not found`);

    const logoBuffer = logo ? Buffer.from(logo, 'base64') : undefined;

    const updatedLodge = await prisma.lodge.update({
      where: { lodge_id: id },
      data: {
        name,
        phone,
        email,
        address,
        duedate: duedate ? new Date(duedate) : lodge.duedate,
        logo: logoBuffer || lodge.logo,
      },
    });

    return this.toBase64(updatedLodge);
  }

  // Block / Unblock lodge
  async blockLodge(id: number, block: boolean, reason?: string) {
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: id } });
    if (!lodge) throw new NotFoundException(`Lodge with ID ${id} not found`);

    if (block) {
      if (!reason) throw new BadRequestException('Block reason is required');

      const updatedLodge = await prisma.$transaction(async (tx) => {
        await tx.lodgeBlock.create({
          data: {
            lodge_id: id,
            reason,
          },
        });

        const lodgeUpdate = await tx.lodge.update({
          where: { lodge_id: id },
          data: { is_active: false },
        });

        return lodgeUpdate;
      });

      return {
        message: `Lodge has been blocked successfully`,
        lodge: this.toBase64(updatedLodge),
      };
    } else {
      // Unblock
      const updatedLodge = await prisma.$transaction(async (tx) => {
        await tx.lodgeBlock.deleteMany({ where: { lodge_id: id } });

        const lodgeUpdate = await tx.lodge.update({
          where: { lodge_id: id },
          data: { is_active: true },
        });

        return lodgeUpdate;
      });

      return {
        message: `Lodge has been unblocked successfully`,
        lodge: this.toBase64(updatedLodge),
      };
    }
  }

  // Delete lodge and all related data
  async deleteLodge(id: number) {
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: Number(id) } });
    if (!lodge) throw new NotFoundException(`Lodge with ID ${id} not found`);

    await prisma.$transaction([
      prisma.cancel.deleteMany({ where: { lodge_id: id } }),
      prisma.billing.deleteMany({ where: { lodge_id: id } }),
      prisma.expense.deleteMany({ where: { lodge_id: id } }),
      prisma.income.deleteMany({ where: { lodge_id: id } }),
      prisma.lodgeBlock.deleteMany({ where: { lodge_id: id } }),
      prisma.defaultValue.deleteMany({ where: { lodge_id: id } }),
      prisma.peak_hours.deleteMany({ where: { lodge_id: id } }),
      prisma.booking.deleteMany({ where: { lodge_id: id } }),
      prisma.admin.deleteMany({ where: { lodge_id: id } }),
      prisma.administrator.deleteMany({ where: { lodge_id: id } }),
      prisma.appPayment.deleteMany({ where: { lodge_id: id } }),
      prisma.facilitator.deleteMany({ where: { lodge_id: id } }),
      prisma.drawing.deleteMany({ where: { lodge_id: id } }),
      prisma.submitTicket.deleteMany({ where: { lodge_id: id } }),
      prisma.message.deleteMany({ where: { lodge_id: id } }),
      prisma.user.deleteMany({ where: { lodge_id: id } }),
      prisma.lodge.delete({ where: { lodge_id: id } }),
    ]);

    return { message: '✅ Lodge and all related records deleted successfully' };
  }
}
