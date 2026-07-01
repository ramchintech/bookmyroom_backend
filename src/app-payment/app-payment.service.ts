import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, AppPaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_YEARLY_AMOUNT = 10; // your base payment amount
const GST_RATE = 0.18; // 18% GST

@Injectable()
export class AppPaymentService {
  /**
   * ✅ Create or renew yearly payment
   * Allowed 30 days before due date or any time after.
   */
  async createYearlyPayment(lodgeId: number, transactionId?: string) {
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: lodgeId } });
    if (!lodge) throw new NotFoundException(`Lodge ID ${lodgeId} not found.`);

    const dueDate = lodge.duedate ? new Date(lodge.duedate) : null;
    const now = new Date();

    let periodStart: Date;
    let periodEnd: Date;

    // 🔍 Check for duplicate active or upcoming payments
    const duplicate = await prisma.appPayment.findFirst({
      where: {
        lodge_id: lodgeId,
        status: { in: [AppPaymentStatus.PENDING, AppPaymentStatus.COMPLETED] },
        OR: [{ periodStart: { gte: now } }, { periodEnd: { gte: now } }],
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        `Duplicate payment found for ${duplicate.periodStart.getFullYear()}–${duplicate.periodEnd.getFullYear()}.`,
      );
    }

    // 🧾 First-time payment
    if (!dueDate) {
      periodStart = new Date();
      periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      // 🧾 Renewal case → check renewal window (30 days before due)
      const oneMonthBeforeDue = new Date(dueDate);
      oneMonthBeforeDue.setDate(oneMonthBeforeDue.getDate() - 30);

      if (now < oneMonthBeforeDue) {
        throw new BadRequestException(
          `Renewal not allowed yet. You can renew from ${oneMonthBeforeDue.toDateString()} onwards.`,
        );
      }

      // ✅ Set new payment period
      periodStart = new Date(dueDate);
      periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // 💰 Calculate amount + GST
    const gstAmount = +(BASE_YEARLY_AMOUNT * GST_RATE).toFixed(2);
    const totalAmount = +(BASE_YEARLY_AMOUNT + gstAmount).toFixed(2);

    const payment = await prisma.appPayment.create({
      data: {
        lodge_id: lodgeId,
        BaseAmount: BASE_YEARLY_AMOUNT,
        gst: gstAmount,
        amount: totalAmount,
        transactionId: transactionId ?? null,
        periodStart,
        periodEnd,
        status: AppPaymentStatus.PENDING,
      },
    });

    return { ...payment, gstAmount, totalAmount };
  }

  /**
   * ✅ Update payment status
   */
  async updatePaymentStatus(
    paymentId: number,
    status: AppPaymentStatus,
    transactionId?: string,
  ) {
    const payment = await prisma.appPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment)
      throw new NotFoundException(`Payment ID ${paymentId} not found.`);

    const updateData: any = {
      status,
      transactionId: transactionId ?? payment.transactionId,
    };

    if (status === AppPaymentStatus.COMPLETED) {
      updateData.paidAt = new Date();

      const [updatedPayment] = await prisma.$transaction([
        prisma.appPayment.update({
          where: { id: paymentId },
          data: updateData,
        }),
        prisma.lodge.update({
          where: { lodge_id: payment.lodge_id },
          data: { duedate: payment.periodEnd },
        }),
      ]);

      return updatedPayment;
    }

    return prisma.appPayment.update({
      where: { id: paymentId },
      data: updateData,
    });
  }

  /**
   * ✅ Get current payment and renewal eligibility
   */
  async getCurrentPayment(lodgeId: number) {
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: lodgeId } });
    if (!lodge) throw new NotFoundException(`Lodge ID ${lodgeId} not found.`);

    const dueDate = lodge.duedate ? new Date(lodge.duedate) : null;
    const now = new Date();

    // 🔍 Existing pending or failed payment
    const payment = await prisma.appPayment.findFirst({
      where: {
        lodge_id: lodgeId,
        status: { in: [AppPaymentStatus.PENDING, AppPaymentStatus.FAILED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      const base = Number(payment.BaseAmount);
      const gstAmount = +(base * GST_RATE).toFixed(2);
      const totalAmount = +(base + gstAmount).toFixed(2);

      return { ...payment, gstAmount, totalAmount, canRenew: true };
    }

    // 🧾 No pending payment — calculate next eligibility
    if (!dueDate) {
      // First-time payment
      const base = BASE_YEARLY_AMOUNT;
      const gstAmount = +(base * GST_RATE).toFixed(2);
      const totalAmount = +(base + gstAmount).toFixed(2);

      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);

      return {
        id: null,
        status: 'None',
        BaseAmount: base,
        gstAmount,
        totalAmount,
        periodStart: start,
        periodEnd: end,
        canRenew: true,
      };
    }

    // 🧾 Renewal window check based on lodge due date
    const oneMonthBeforeDue = new Date(dueDate);
    oneMonthBeforeDue.setDate(oneMonthBeforeDue.getDate() - 30);
    const canRenew = now >= oneMonthBeforeDue;

    const nextStart = new Date(dueDate);
    const nextEnd = new Date(nextStart);
    nextEnd.setFullYear(nextEnd.getFullYear() + 1);

    const base = BASE_YEARLY_AMOUNT;
    const gstAmount = +(base * GST_RATE).toFixed(2);
    const totalAmount = +(base + gstAmount).toFixed(2);

    return {
      id: null,
      status: 'None',
      BaseAmount: base,
      gstAmount,
      totalAmount,
      periodStart: nextStart,
      periodEnd: nextEnd,
      canRenew,
    };
  }

  /**
   * ✅ Get payment history
   */
  async getPaymentHistory(lodgeId: number) {
    const payments = await prisma.appPayment.findMany({
      where: { lodge_id: lodgeId },
      orderBy: { periodStart: 'desc' },
    });

    if (!payments.length)
      throw new NotFoundException(`No payments found for lodge ID ${lodgeId}`);

    return payments.map((p) => {
      const base = Number(p.BaseAmount);
      const gstAmount = +(base * GST_RATE).toFixed(2);
      const totalAmount = +(base + gstAmount).toFixed(2);
      return { ...p, gstAmount, totalAmount };
    });
  }

  /**
   * ✅ Auto-expire old completed payments
   */
  async expireOldPayments() {
    const now = new Date();
    const result = await prisma.appPayment.updateMany({
      where: {
        status: AppPaymentStatus.COMPLETED,
        periodEnd: { lt: now },
      },
      data: { status: AppPaymentStatus.FAILED },
    });
    return { expiredCount: result.count };
  }
}
