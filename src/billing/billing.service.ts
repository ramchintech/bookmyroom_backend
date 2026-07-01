import { Injectable } from '@nestjs/common';
import { PrismaClient,Billing,Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

@Injectable()
export class BillingService {

async createBillingAndUpdateStatus(
    lodge_id: number,
    user_id: string,
    booking_id: number,
    reason: any,
    total: number | null,
    balancePayment: number | null,
    payment_method: string | null,
    current_time?: string,
  ) {
    balancePayment = Number(balancePayment) || 0;

    const hasBilling =
      (reason && Object.keys(reason).length > 0) ||
      (total !== null && total !== 0);

    return prisma.$transaction(async (tx) => {
      let billing: Billing | null = null;

      // 1. Load booking
      const booking = await tx.booking.findUnique({
        where: { booking_id_lodge_id: { booking_id, lodge_id } },
      });

      if (!booking) throw new Error("Booking not found");

      // 🔥 SAVE id_proof links before clearing DB
      // --- Extract id_proof safely ---
let idProofLinks: string[] = [];

if (booking.id_proof !== null && booking.id_proof !== undefined) {
  const value = booking.id_proof as any;

  if (Array.isArray(value)) {
    // JSON array
    idProofLinks = value.map((v) => String(v));
  } else if (typeof value === "string") {
    // string or JSON string
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        idProofLinks = parsed.map((v) => String(v));
      } else {
        idProofLinks = value.split(",");
      }
    } catch {
      idProofLinks = value.split(",");
    }
  } else if (typeof value === "object") {
    // Unexpected object: ignore
    idProofLinks = [];
  } else {
    // number, boolean, etc.
    idProofLinks = [String(value)];
  }
}

      // 2. Compare checkout
      const now = current_time ? new Date(current_time) : new Date();
      let updatedCheckOut = booking.check_out;
      let oldCheckOut = booking.old_check_out ?? null;

      if (now < booking.check_out) {
        oldCheckOut = booking.check_out;
        updatedCheckOut = now;
      }

      // 3. Billing record
      if (hasBilling) {
        billing = await tx.billing.create({
          data: {
            lodge_id,
            user_id,
            booking_id,
            reason: reason ?? null,
            total: total ?? 0,
            payment_method,
          },
        });
      }

      // 4. Income
      if (balancePayment > 0) {
        await tx.income.create({
          data: {
            lodge_id,
            user_id,
            reason: `Billing for booking ${booking_id}`,
            amount: balancePayment,
            type: "BILLING",
          },
        });
      }

      // 5. Expense
      if (balancePayment < 0) {
        await tx.expense.create({
          data: {
            lodge_id,
            user_id,
            reason: `Refund for booking ${booking_id}`,
            amount: Math.abs(balancePayment),
            type: "BILLING",
          },
        });
      }

      // 6. Update booking AND clear id_proof field
      await tx.booking.update({
        where: {
          booking_id_lodge_id: { booking_id, lodge_id },
        },
        data: {
          status: "BILLED",
          check_out: updatedCheckOut,
          old_check_out: oldCheckOut,
          id_proof: Prisma.JsonNull
        },
      });

      // 🔥 7. DELETE ID PROOF IMAGES FROM SERVER (after DB update)

      for (const url of idProofLinks) {
        try {
          const parsed = new URL(url);

          // URL example:
          // http://localhost:3006/lodge_image/6/idproof/filename.jpg
          const filePath = path.join(
            '/var/www/lodge_image', // change this if needed
            parsed.pathname.replace('/lodge_image/', '')
          );

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Deleted file:", filePath);
          }
        } catch (err) {
          console.error("Delete failed:", url, err);
        }
      }

      return {
        success: true,
        message: "Billing completed & ID proof deleted",
        billing,
        booking_id,
        balancePayment,
        old_check_out: oldCheckOut,
        new_check_out: updatedCheckOut,
      };
    });
  }

  async findAll() {
    return prisma.billing.findMany({
      select: {
        id: true,
        booking_id: true,
        lodge_id: true,
        user_id: true,
        reason: true,
        total: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByLodgeId(lodge_id: number) {
    return prisma.billing.findMany({
      where: { lodge_id },
      select: {
        id: true,
        booking_id: true,
        lodge_id: true,
        user_id: true,
        reason: true,
        total: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(booking_id: number, lodge_id: number) {
    return prisma.billing.findUnique({
      where: { booking_id_lodge_id: { booking_id, lodge_id } },
      select: {
        id: true,
        booking_id: true,
        lodge_id: true,
        user_id: true,
        reason: true,
        total: true,
        created_at: true,
        updated_at: true,
      },
    });

  }
  
  async getChargesByBookingId(bookingId: number) {
    try {
      const charges = await prisma.charges.findMany({
        where: { booking_id: bookingId },
        select: {
          reason: true,
          amount: true,
        },
      });
      return charges;
    } catch (error) {
      throw new Error('Failed to fetch charges');
    }
  }

  async getBookedData(lodgeId: number) {

  return prisma.booking.findMany({
    where: {
      lodge_id: lodgeId,
      status: "BOOKED",
    },
    orderBy: {
      created_at: "asc",
    },
  });
}
}
