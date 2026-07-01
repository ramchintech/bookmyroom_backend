import { Injectable, NotFoundException ,BadRequestException} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClient } from '@prisma/client';
import { CreatePeakHourDto } from './dto/create-peak-hour.dto';

const prisma = new PrismaClient();

@Injectable()
export class PeakHoursService {
  // 🟢 Get all peaks for a lodge
  async findAllByLodge(lodgeId: number) {
    const peaks = await prisma.peak_hours.findMany({
      where: { lodge_id: lodgeId },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        date: true,
        reason: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { date: 'asc' },
    });

    if (!peaks.length)
      throw new NotFoundException(`No peak hours found for lodge ID ${lodgeId}`);
    return peaks;
  }

  // 🟡 Get a specific peak by lodge and date
  async findByLodgeAndDate(lodgeId: number, dateStr: string) {
    const date = new Date(dateStr);

    const peak = await prisma.peak_hours.findUnique({
      where: {
        lodge_id_date: { lodge_id: lodgeId, date },
      },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        date: true,
        reason: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!peak)
      throw new NotFoundException(`No peak hour found for lodge ID ${lodgeId} on ${dateStr}`);
    return peak;
  }

  // 🟢 Create a new peak hour (with duplicate check)
  async create(dto: CreatePeakHourDto) {
    const { lodge_id, user_id, date, reason } = dto;

    // ✅ Verify lodge exists
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id } });
    if (!lodge) throw new NotFoundException(`Lodge ${lodge_id} not found`);

    // ✅ Verify user exists under lodge
    const user = await prisma.user.findUnique({
      where: { user_id_lodge_id: { user_id, lodge_id } },
    });
    if (!user)
      throw new NotFoundException(
        `User ${user_id} not found in lodge ${lodge_id}`,
      );

    // ✅ Attempt to create new record safely
    try {
      return await prisma.peak_hours.create({
        data: {
          lodge_id,
          user_id,
          date: new Date(date),
          reason: reason?.trim() ?? '',
        },
        select: {
          id: true,
          lodge_id: true,
          user_id: true,
          date: true,
          reason: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error) {
      // ✅ Catch duplicate date for same lodge
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Peak hour already exists for ${new Date(date).toLocaleDateString()}`,
        );
      }
    }
  }

  // 🔴 Delete a peak hour
  async delete(lodgeId: number, id: number) {
console.log('Delete request received:', { lodgeId, id });
const peak = await prisma.peak_hours.findUnique({ where: { id } });
console.log('Found peak:', peak);

    if (!peak || peak.lodge_id !== lodgeId)
      throw new NotFoundException(`Peak hour ${id} not found for lodge ${lodgeId}`);

    await prisma.peak_hours.delete({ where: { id } });

    return { message: `Peak hour ${id} deleted successfully` };
  }
}
