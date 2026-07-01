import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
function extractRoomNumbersFromBookedRoomEntry(entry: any): string[] {
  if (Array.isArray(entry)) {
    const maybeNums = entry.length >= 3 ? entry[2] : undefined;

    if (Array.isArray(maybeNums)) {
      return maybeNums.map((n: any) => String(n)).filter(Boolean);
    }

    if (typeof maybeNums === "string" || typeof maybeNums === "number") {
      return String(maybeNums)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }

    return [];
  }

  if (typeof entry === "string" || typeof entry === "number") {
    return String(entry)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
}
@Injectable()
export class HomeService {
  
  async getAvailableRooms(lodgeId: number, checkIn: string | Date, checkOut: string | Date) {
    // 0️⃣ Validate and parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
  
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid check-in or check-out date');
    }
  
    // 1️⃣ Get all rooms for the lodge
    const rooms = await prisma.rooms.findMany({
      where: { lodge_id: lodgeId },
      select: {
        room_type: true,
        room_name: true,
        room_number: true, // JSON array
      },
    });
  
    // 2️⃣ Get overlapping bookings for the lodge
    const overlapping = await prisma.booking.findMany({
      where: {
        lodge_id: lodgeId,
        status: { in: ["BOOKED", "PREBOOKED", "BILLED"] },
        check_in: { lt: checkOutDate },
        check_out: { gt: checkInDate },
      },
      select: { booked_room: true },
    });
  
    // 3️⃣ Flatten booked room numbers from booked_room arrays
    const booked = new Set<string>();
  
    overlapping.forEach(b => {
      if (Array.isArray(b.booked_room)) {
        b.booked_room.forEach((entry: any) => {
          // each entry is like [room_name, room_type, room_numbers]
          const roomNumbers = entry[2]; 
          if (Array.isArray(roomNumbers)) {
            roomNumbers.forEach((n: any) => booked.add(String(n)));
          } else if (roomNumbers) {
            booked.add(String(roomNumbers));
          }
        });
      }
    });
  
    // 4️⃣ Group rooms by type + name and calculate available rooms
    const result = new Map<string, {
      room_type: string;
      room_name: string;
      available_rooms: string[];
      total_rooms: number;
      all_room_numbers: string[];
    }>();
  
    rooms.forEach(room => {
      const key = `${room.room_type}-${room.room_name}`;
      const numbers: string[] = Array.isArray(room.room_number)
        ? room.room_number.map(String)
        : [String(room.room_number)];
  
      const available = numbers.filter(n => !booked.has(n));
  
      if (!result.has(key)) {
        result.set(key, {
          room_type: room.room_type,
          room_name: room.room_name,
          available_rooms: available,
          total_rooms: numbers.length,
          all_room_numbers: numbers,
        });
      } else {
        const grp = result.get(key)!;
        grp.available_rooms.push(...available);
        grp.total_rooms += numbers.length;
        grp.all_room_numbers.push(...numbers);
      }
    });
  
    return Array.from(result.values());
  }

  async get7DayAvailability(
  lodgeId: number,
  currentTime: string | Date
) {
  const todayNow = new Date(currentTime);
  if (isNaN(todayNow.getTime())) {
    throw new BadRequestException("Invalid current time");
  }

  // Helper to get day start
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  // Helper to get day end
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const results: {
  day: number;
  date: string;
  check_in: Date;
  check_out: Date;
  availability: {
    room_type: string;
    room_name: string;
    available_rooms: string[];
    total_rooms: number;
    all_room_numbers: string[];
  }[];
}[] = [];

  // Loop for 7 days
  for (let i = 0; i < 7; i++) {
    const baseDate = new Date(todayNow);
    baseDate.setDate(todayNow.getDate() + i);

    let checkIn: Date;
    let checkOut: Date;

    if (i === 0) {
      // TODAY
      checkIn = todayNow;          // current time
      checkOut = endOfDay(baseDate);
    } else {
      // NEXT 6 DAYS
      checkIn = startOfDay(baseDate);
      checkOut = endOfDay(baseDate);
    }

    const dayAvailability = await this.getAvailableRooms(
      lodgeId,
      checkIn,
      checkOut
    );

    results.push({
      day: i,
      date: baseDate.toISOString().split("T")[0],
      check_in: checkIn,
      check_out: checkOut,
      availability: dayAvailability,
    });
  }

  return results;
}

async getRoomCountsForNext7Days(lodgeId: number) {

  // 🔹 Step 1 — Fetch all rooms
  const rooms = await prisma.rooms.findMany({
    where: { lodge_id: lodgeId },
    select: {
      room_name: true,
      room_type: true,
      room_number: true,
    }
  });


  // 🔹 Step 2 — Group rooms
  type RoomGroup = {
    room_name: string;
    room_type: string;
    total_rooms: string[];
  };

  const groups = new Map<string, RoomGroup>();

  rooms.forEach(r => {
    const key = `${r.room_name}-${r.room_type}`;
    const nums = Array.isArray(r.room_number)
      ? r.room_number.map(String)
      : [String(r.room_number)];

    if (!groups.has(key)) {
      groups.set(key, {
        room_name: r.room_name,
        room_type: r.room_type,
        total_rooms: nums
      });
    } else {
      groups.get(key)!.total_rooms.push(...nums);
    }
  });



  // 🔹 Step 3 — Fetch relevant bookings (7 days)
  const now = new Date(); // 👉 real current time
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(startOfToday);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const bookings = await prisma.booking.findMany({
    where: {
      lodge_id: lodgeId,
      status: { in: ["BOOKED", "PREBOOKED", "BILLED"] },
      check_in: { lt: sevenDaysLater },
      check_out: { gt: now } // today booking still relevant
    },
    select: {
      check_in: true,
      check_out: true,
      booked_room: true
    }
  });



  const extractRoomNumbers = (entry: any) => {
    if (!entry) return [];
    if (Array.isArray(entry)) return entry.map(String);
    return [String(entry)];
  };



  // 🔹 Step 4 — Build result for next 7 days
  const result: any[] = [];

  groups.forEach(group => {
    const days: any[] = [];

    for (let i = 0; i < 7; i++) {

      let dayStart: Date;
      let dayEnd: Date;

      if (i === 0) {
        // 🔥 TODAY → start from *current time*
        dayStart = new Date(now);
        dayEnd = new Date(startOfToday);
        dayEnd.setDate(dayEnd.getDate() + 1); // end of today
      } else {
        // 🔥 NEXT DAYS → use whole day
        dayStart = new Date(startOfToday);
        dayStart.setDate(dayStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
      }


      // Track booked rooms for this day
      const bookedRooms = new Set<string>();

      bookings.forEach(b => {
        if (b.check_in < dayEnd && b.check_out > dayStart) {

          const bookedEntries = Array.isArray(b.booked_room)
            ? b.booked_room
            : (b.booked_room ? [b.booked_room] : []);

          bookedEntries.forEach((entry: any) => {
            const roomNums = extractRoomNumbers(entry);
            roomNums.forEach(n => bookedRooms.add(String(n)));
          });
        }
      });


      const total = group.total_rooms.length;
      const unavailableCount = group.total_rooms.filter(n => bookedRooms.has(n)).length;
      const availableCount = total - unavailableCount;


      days.push({
        date: dayStart.toISOString().split("T")[0],
        available_count: availableCount,
        unavailable_count: unavailableCount
      });
    }


    result.push({
      room_type: group.room_type,
      room_name: group.room_name,
      total_count: group.total_rooms.length,
      days
    });
  });

  return result;
}


async getCurrentRoomAvailability(lodgeId: number) {

  // 🔹 Define today range
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);


  // 🔹 Fetch all rooms
  const rooms = await prisma.rooms.findMany({
    where: { lodge_id: lodgeId },
    select: {
      room_name: true,
      room_type: true,
      room_number: true,
    }
  });


  // 🔹 Group rooms by (room_name + room_type)
  interface RoomGroup {
    room_name: string;
    room_type: string;
    total_rooms: string[];
  }

  const groups = new Map<string, RoomGroup>();

  rooms.forEach(r => {
    const key = `${r.room_name}-${r.room_type}`;
    const nums = Array.isArray(r.room_number)
      ? r.room_number.map(String)
      : [String(r.room_number)];

    if (!groups.has(key)) {
      groups.set(key, {
        room_name: r.room_name,
        room_type: r.room_type,
        total_rooms: nums,
      });
    } else {
      groups.get(key)!.total_rooms.push(...nums);
    }
  });



  // 🔹 Fetch bookings overlapping today
  const now = new Date();

const bookings = await prisma.booking.findMany({
  where: {
    lodge_id: lodgeId,
    status: { in: ["BOOKED", "PREBOOKED", "BILLED"] },
    check_in: { lt: endOfToday },   // booking started before end of today
    check_out: { gt: now }          // booking has not yet checked out
  },
  select: { booked_room: true },
});


  // 🔹 Track booked rooms today
  const bookedToday = new Set<string>();

  bookings.forEach(b => {
    if (!Array.isArray(b.booked_room)) return;

    b.booked_room.forEach(entry => {
      const roomNumbers = extractRoomNumbersFromBookedRoomEntry(entry);
      roomNumbers.forEach(n => bookedToday.add(n));
    });
  });



  // 🔹 Prepare final result
  const result: any[] = [];

  groups.forEach(g => {
    const bookedCount = g.total_rooms.filter(n => bookedToday.has(n)).length;

    result.push({
      room_name: g.room_name,
      room_type: g.room_type,
      total: g.total_rooms.length,
      booked: bookedCount,
      available: g.total_rooms.length - bookedCount,
    });
  });

  return result;
}



  async getFinanceSummary(lodgeId: number) {
    // Check if lodge exists
    const lodge = await prisma.lodge.findUnique({ where: { lodge_id: lodgeId } });
    if (!lodge) {
      throw new NotFoundException(`Lodge with ID ${lodgeId} not found`);
    }

    // Total Income
    const totalIncomeResult = await prisma.income.aggregate({
      _sum: { amount: true },
      where: { lodge_id: lodgeId },
    });
    const totalIncome = totalIncomeResult._sum.amount ?? 0;

    // Total Expense
    const totalExpenseResult = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { lodge_id: lodgeId },
    });
    const totalExpense = totalExpenseResult._sum.amount ?? 0;

    // Total Drawing In
    const totalDrawingInResult = await prisma.drawing.aggregate({
      _sum: { amount: true },
      where: { lodge_id: lodgeId, type: 'in' },
    });
    const totalDrawingIn = totalDrawingInResult._sum.amount ?? 0;

    // Total Drawing Out
    const totalDrawingOutResult = await prisma.drawing.aggregate({
      _sum: { amount: true },
      where: { lodge_id: lodgeId, type: 'out' },
    });
    const totalDrawingOut = totalDrawingOutResult._sum.amount ?? 0;

    // Current Balance
    const currentBalance = totalIncome + totalDrawingIn - totalExpense - totalDrawingOut;

    return {
      totalIncome,
      totalExpense,
      totalDrawingIn,
      totalDrawingOut,
      currentBalance,
    };
  }

}
