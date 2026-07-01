import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class HistoryService {

  async getBookedData(lodgeId: number) {
    return prisma.booking.findMany({
      where: {
        lodge_id: lodgeId,
        status: {
          in: ["BOOKED", "BILLED"],
        },
      },
      include: {
        billing: true,
        PartialCancels: true, // FIXED ✔
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }

  async getCancelledData(lodgeId: number) {
    return prisma.booking.findMany({
      where: {
        lodge_id: lodgeId,
        status: "CANCEL",
      },
      include: {
        cancel: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }

  async getPartialCancelData(lodgeId: number) {
    return prisma.partialCancel.findMany({
      where: {
        lodge_id: lodgeId,
      },
      include: {
        booking: true, // FIXED ✔
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }

  async getPreBookedData(lodgeId: number) {
    return prisma.booking.findMany({
      where: {
        lodge_id: lodgeId,
        status: "PREBOOKED",
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }
}
