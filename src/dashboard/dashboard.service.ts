import { Injectable,NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
@Injectable()
export class DashboardService {

  async getDashboardStats() {
  const totalLodgeCount = await prisma.lodge.count({
    where: {
      lodge_id: {
        not: 0
      }
    }
  });

  const totalBookingsCount = await prisma.booking.count();

  const activeUsersCount = await prisma.user.count({
    where: {
      is_active: true,
      lodge_id: {
        not: 0
      }
    }
  });

  return {
    totalLodgeCount,
    totalBookingsCount,
    activeUsersCount,
  };
}


 async getLodgeStats(lodgeId: number) {
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: lodgeId } });
    if (!lodge) throw new NotFoundException(`Lodge with ID ${lodgeId} not found`);

    const totalBookings = await prisma.booking.count({
      where: { lodge_id: lodgeId }
    });

    const totalCancelled = await prisma.cancel.count({
      where: { lodge_id: lodgeId }
    });

    const totalPartialCancelled = await prisma.partialCancel.count({
      where: { lodge_id: lodgeId }
    });

    
    const incomeAgg = await prisma.income.aggregate({
      where: { lodge_id: lodgeId },
      _sum: { amount: true }
    });

    const expenseAgg = await prisma.expense.aggregate({
      where: { lodge_id: lodgeId },
      _sum: { amount: true }
    });

    const totalUsers = await prisma.user.count({
      where: {
        lodge_id: lodgeId,
        is_active: true
      }
    });

    return {
      lodgeId,
      lodgeName: lodge.name,
      totalBookings,
      totalCancelled,
      totalPartialCancelled,
      totalIncome: incomeAgg._sum.amount || 0,
      totalExpense: expenseAgg._sum.amount || 0,
      totalUsers
    };
  }

}
