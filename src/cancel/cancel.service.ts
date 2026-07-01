import { Injectable, NotFoundException} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CalculateCancelDto } from './dto/calculate.dto';
import { CreateCancelDto } from './dto/create-cancel.dto';
import { PartialCancelDto } from './dto/partial-cancel.dto';

const prisma = new PrismaClient();

@Injectable()
export class CancelService {

   async createCancel(dto: CreateCancelDto) {
    const {
      bookingId,
      lodgeId,
      userId,
      reason,
      amountPaid,
      cancelCharge,
      refund,
    } = dto;

    return await prisma.$transaction(async (tx) => {

      // Check if booking exists
      const booking = await tx.booking.findUnique({
        where: {
          booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // 1️⃣ Insert into Cancel table
      const cancel = await tx.cancel.create({
        data: {
          booking_id: bookingId,
          lodge_id: lodgeId,
          user_id: userId ?? '',
          reason: reason ?? 'Cancelled by system',
          amount_paid: amountPaid ?? 0,
          cancel_charge: cancelCharge ?? 0,
          refund: refund ?? 0,
        },
      });

      // 2️⃣ Update Booking status
      await tx.booking.update({
        where: { booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId } },
        data: { status: 'CANCEL' },
      });
     if (refund && refund > 0) {
  await tx.expense.create({
    data: {
      lodge_id: lodgeId,
      user_id: userId,
      reason: `Refund for Cancellation #${booking.booking_id}`,
      amount: refund,
      type: "CANCEL",
    },
  });
}

      // 3️⃣ Insert into Expense if refund > 0
      // if (refund && refund > 0) 
      // {
      //   await tx.expense.create({
      //     data: {
      //       lodge_id: lodgeId,
      //       user_id:userId,
      //       type: 'cancel',
      //       reason: `Refund for booking ${bookingId}`,
      //       amount: refund,
      //     },
      //   });
      // }

      return cancel;
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

async calculateCancelCharge(dto: CalculateCancelDto) {
    const { bookingId, baseAmount, checkInDate, lodgeId } = dto;
    const checkIn = new Date(checkInDate);

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId } },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Check if peak hour exists
    const peakHour = await prisma.peak_hours.findFirst({
      where: {
        lodge_id: lodgeId,
        date: checkIn,
      },
    });

    // Fetch cancel percentage
    const cancelType = peakHour ? 'PEAK_HOUR' : 'DEFAULT';
    const defaultCancel = await prisma.defaultValue.findFirst({
      where: {
        lodge_id: lodgeId,
        type: cancelType,
        reason: 'CANCEL',
      },
    });

    const cancelPercentage = defaultCancel?.amount ?? 0;
    const cancellationCharge = (baseAmount * cancelPercentage) / 100;
    const refund = baseAmount - cancellationCharge;

    return {
      bookingId,
      baseAmount,
      cancelPercentage,
      cancellationCharge,
      refund,
    };
  }

  // 🔹 1️⃣ Get all cancel records
  async findAll() {
    return prisma.cancel.findMany({
      select: {
        id: true,
        booking_id: true,
        lodge_id: true,
        user_id: true,
        reason: true,
        amount_paid: true,
        cancel_charge: true,
        refund: true,
        created_at: true,
      },
    });
  }

  // 🔹 2️⃣ Get all cancellations for a specific lodge
  async findByLodgeId(lodge_id: number) {
    return prisma.cancel.findMany({
      where: { lodge_id },
      select: {
        id: true,
        booking_id: true,
        lodge_id: true,
        user_id: true,
        reason: true,
        amount_paid: true,
        cancel_charge: true,
        refund: true,
        created_at: true,
      },
    });
  }

async partialCancel(dto: PartialCancelDto) {
  const {
    bookingId,
    lodgeId,
    userId,
    roomNumbers,      // 👈 structured selected rooms
    reason,
    amountPaid,
    cancelCharge,
    refund,
  } = dto;

  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Fetch booking
    const booking = await tx.booking.findUnique({
      where: {
        booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId },
      },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    const bookedRooms = booking.booked_room as any[];
    const roomAmount = booking.room_amount as any[];

    // 2️⃣ Update booked_room by removing cancelled numbers
    const updatedBookedRooms = bookedRooms
      .map((item) => {
        const [roomName, roomType, nums] = item;

        const cancelEntry = roomNumbers.find(
          (r) => r.room_name === roomName && r.room_type === roomType
        );

        if (!cancelEntry) return item;

        const remaining = nums.filter(
          (n: string) => !cancelEntry.room_numbers.includes(n)
        );

        return [roomName, roomType, remaining];
      })
      .filter((item) => item[2].length > 0); // remove empty groups

    // 3️⃣ Build detailed cancellation note
    const cancelledDetails = roomNumbers.map((r) => {
      const amt = roomAmount.find(
        (a) => a.room_name === r.room_name && a.room_type === r.room_type
      );

      const price = amt ? amt.base_amount_per_room : 0;
      const total = price * r.room_numbers.length;

      return {
        room_name: r.room_name,
        room_type: r.room_type,
        cancelled_numbers: r.room_numbers,
        base_amount_per_room: price,
        total_cancel_value: total
      };
    });

    const noteEntry = {
      message: "Partial Cancellation",
      reason,
      cancelledAt: new Date(),
      cancelled_rooms: cancelledDetails,
      total_refund: refund ?? 0,
      cancel_charge: cancelCharge ?? 0,
      amount_paid: amountPaid ?? 0
    };

    const oldNotes =
      typeof booking.notes === "object" && booking.notes !== null
        ? booking.notes
        : {};

    // 4️⃣ Update only booked_room + notes
    const updatedBooking = await tx.booking.update({
      where: { booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId } },
      data: {
        booked_room: updatedBookedRooms,
        notes: {
          ...oldNotes,
          partial_cancel: noteEntry,
        },
      },
    });

    // 5️⃣ log partial cancellation
    const cancel = await tx.partialCancel.create({
      data: {
        booking_id: bookingId,
        lodge_id: lodgeId,
        user_id: userId,
        reason: reason ?? "Partial room cancellation",
        room_number: cancelledDetails,  // store detailed summary
        amount_paid: amountPaid ?? 0,
        cancel_charge: cancelCharge ?? 0,
        refund: refund ?? 0,
      },
    });

    // 6️⃣ Add expense entry for refund
    if (refund && refund > 0) {
      await tx.expense.create({
        data: {
          lodge_id: lodgeId,
          user_id: userId,
          reason: `Refund for partial cancellation #${bookingId}`,
          type: "PARTIAL_CANCEL",
          amount: refund,
        },
      });
    }

    return {
      message: "Partial cancellation successful",
      cancel,
      booking: updatedBooking,
    };
  });
}

  // 🔹 3️⃣ Get one cancellation by booking_id + lodge_id
  // async findOne(id: number, lodge_id: number) {
  //   return prisma.cancel.findUnique({
  //           where: { id  },

  //     // where: { booking_id_lodge_id: { booking_id, lodge_id } },
  //     select: {
  //       id: true,
  //       booking_id: true,
  //       lodge_id: true,
  //       user_id: true,
  //       reason: true,
  //       amount_paid: true,
  //       cancel_charge: true,
  //       refund: true,
  //       created_at: true,
  //     },
  //   });
  // }
}
