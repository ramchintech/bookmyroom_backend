import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateChargesDto } from './dto/create-charge.dto';
import { UpdateChargesDto } from './dto/update-charge.dto';

const prisma = new PrismaClient();

@Injectable()
export class ChargesService {

 async create(dto: CreateChargesDto) {
  return prisma.charges.create({
    data: {
      ...dto,
      status: 'INCOMPLETE', // ✅ include inside `data`
    },
  });
}
  async update(id: number, dto: UpdateChargesDto) {
    return prisma.charges.update({
      where: { id },
      data: dto,
    });
  }

  async findAllByLodge(lodge_id: number) {
    return prisma.charges.findMany({
      where: { lodge_id },
      orderBy: { created_at: 'desc' },
      include: {
        booking: true,
        user: true,
      },
    });
  }

  async findGroupedByBooking(lodge_id: number) {
    const charges = await prisma.charges.findMany({
      where: { lodge_id },
      select: {
        booking_id: true,
        reason: true,
        amount: true,
      },
      orderBy: { booking_id: 'asc' },
    });

    // Group by booking_id
    const grouped = charges.reduce((acc, charge) => {
      if (!acc[charge.booking_id]) acc[charge.booking_id] = [];
      acc[charge.booking_id].push({
        reason: charge.reason,
        amount: charge.amount,
      });
      return acc;
    }, {} as Record<number, { reason: string; amount: number }[]>);

    return grouped;
  }

  async findOne(id: number) {
    const data = await prisma.charges.findUnique({
      where: { id },
      include: { booking: true, user: true },
    });

    if (!data) throw new NotFoundException('Charges not found');
    return data;
  }

   async remove(id: number) {
    await this.findOne(id);
    return prisma.charges.delete({ where: { id } });
  }

  async checkBookingIsBooked(booking_id: number, lodge_id: number) {
  const booking = await prisma.booking.findUnique({
    where: {
      booking_id_lodge_id: {
        booking_id,
        lodge_id,
      },
    },
    select: { status: true },
  });

  if (!booking) {
    return { exists: false, isBooked: false, message: "Booking not found" };
  }

  return {
    exists: true,
    isBooked: booking.status === "BOOKED",
    status: booking.status,
    message:
      booking.status === "BOOKED"
        ? "Booking is BOOKED"
        : "Booking is NOT BOOKED",
  };
}


}
