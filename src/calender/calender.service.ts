import { Injectable ,BadRequestException, NotFoundException} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CalenderService {

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

async calculateRoomPrice(dto: any) {
  const lodge_id = Number(dto.lodge_id);
  const check_in = new Date(dto.check_in);
  const check_out = new Date(dto.check_out);
  const booked_rooms = dto.booked_rooms; 
  const override_base_amount = dto.override_base_amount
    ? Number(dto.override_base_amount)
    : undefined;

  if (!Array.isArray(booked_rooms) || booked_rooms.length === 0) {
    throw new BadRequestException("booked_rooms must be a non-empty array");
  }
  if (isNaN(check_in.getTime()) || isNaN(check_out.getTime())) {
    throw new BadRequestException("Invalid check-in or check-out date");
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const numDays = Math.ceil((check_out.getTime() - check_in.getTime()) / oneDay);
  if (numDays <= 0) {
    throw new BadRequestException("check_out must be after check_in");
  }

  let totalBase = 0;
  const breakdown: any[] = [];

  for (const entry of booked_rooms) {
    const [room_name, room_type, room_numbers] = entry;
    const numbersArray = Array.isArray(room_numbers) ? room_numbers : [];
    const room_count = numbersArray.length;

    if (!room_name || !room_type || room_count === 0) {
      throw new BadRequestException("Each booked_room entry must contain [room_name, room_type, room_numbers]");
    }

    const reason = `Rent (${room_name} (${room_type}))`;

    let baseAmountPerRoom = 0;
    let pricing_type: "NORMAL" | "PEAK_HOUR" = "NORMAL";

if (override_base_amount) {
  baseAmountPerRoom = override_base_amount;
} else {
  const peak = await prisma.peak_hours.findFirst({
    where: { lodge_id, date: { gte: check_in, lte: check_out } },
  });

  const type = peak ? "Peak Hours" : "Default";
  if (peak) pricing_type = "PEAK_HOUR";

  const defaultValue = await prisma.defaultValue.findFirst({
    where: { lodge_id, reason, type },
  });

      if (!defaultValue) {
        throw new BadRequestException(`Default value missing for ${reason}`);
      }

      baseAmountPerRoom = Number(defaultValue.amount);
    }

    const perRoomTotalForStay = Number((baseAmountPerRoom * numDays).toFixed(2));
    const groupTotalBase = Number((perRoomTotalForStay * room_count).toFixed(2));

    totalBase += groupTotalBase;

    breakdown.push({
      status:pricing_type,
      room_name,
      room_type,
      room_numbers: numbersArray,
      room_count,
      base_amount_per_room: Number(baseAmountPerRoom.toFixed(2)),       
      per_room_total_for_days: perRoomTotalForStay,                     
      group_total_base_amount: groupTotalBase,                          
    });
  }

  totalBase = Number(totalBase.toFixed(2));
  const GST_RATE = await (async () => {
    try {
      const gstEntry = await prisma.defaultValue.findFirst({
        where: { lodge_id, reason: "GST", type: "Default" },
        select: { amount: true },
      });
      if (gstEntry && !isNaN(Number(gstEntry.amount))) {
        return Number(gstEntry.amount); 
      }
    } catch (_) {}
    return 18; 
  })();

  const gstAmount = Number(((totalBase * GST_RATE) / 100).toFixed(2));
  const totalAmount = Number((totalBase + gstAmount).toFixed(2));

  return {
    num_days: numDays,
    total_base_amount: totalBase,
    gst_rate: GST_RATE,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    rooms: breakdown,
  };
}


async updatePricing(dto: any) {
  const lodge_id = Number(dto.lodge_id);
  const check_in = new Date(dto.check_in);
  const check_out = new Date(dto.check_out);
  const booked_rooms = dto.booked_rooms;
  const pricing_type = dto.pricing_type; 

  if (!Array.isArray(booked_rooms) || booked_rooms.length === 0) {
    throw new BadRequestException("booked_rooms must be a non-empty array");
  }
  if (!pricing_type) {
    throw new BadRequestException("pricing_type is required");
  }
  if (isNaN(check_in.getTime()) || isNaN(check_out.getTime())) {
    throw new BadRequestException("Invalid check-in or check-out date");
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const numDays = Math.ceil((check_out.getTime() - check_in.getTime()) / oneDay);
  if (numDays <= 0) {
    throw new BadRequestException("check_out must be after check_in");
  }

  let totalBase = 0;
  const breakdown: any[] = [];

  for (const entry of booked_rooms) {
    const [room_name, room_type, room_numbers] = entry;
    const numbersArray = Array.isArray(room_numbers) ? room_numbers : [];
    const room_count = numbersArray.length;

    if (!room_name || !room_type || room_count === 0) {
      throw new BadRequestException("Each booked_room entry must contain [room_name, room_type, room_numbers]");
    }

    const reason = `Rent (${room_name} (${room_type}))`;

    const defaultValue = await prisma.defaultValue.findFirst({
      where: {
        lodge_id,
        reason,
        type: pricing_type === "PEAK_HOUR" ? "Peak Hours" : "Default",
      },
    });

    if (!defaultValue) {
      throw new BadRequestException(`Default price missing for ${reason} (${pricing_type})`);
    }

    const baseAmountPerRoom = Number(defaultValue.amount);

    const perRoomTotalForStay = Number((baseAmountPerRoom * numDays).toFixed(2));
    const groupTotalBase = Number((perRoomTotalForStay * room_count).toFixed(2));

    totalBase += groupTotalBase;

    breakdown.push({
      room_name,
      room_type,
      room_numbers: numbersArray,
      room_count,
      base_amount_per_room: Number(baseAmountPerRoom.toFixed(2)),
      per_room_total_for_days: perRoomTotalForStay,
      group_total_base_amount: groupTotalBase,
    });
  }

  totalBase = Number(totalBase.toFixed(2));

  // fetch GST from defaults if present, else fallback
  const GST_RATE = await (async () => {
    try {
      const gstEntry = await prisma.defaultValue.findFirst({
        where: { lodge_id, reason: "GST", type: "Default" },
        select: { amount: true },
      });
      if (gstEntry && !isNaN(Number(gstEntry.amount))) return Number(gstEntry.amount);
    } catch (_) {}
    return 18;
  })();

  const gstAmount = Number(((totalBase * GST_RATE) / 100).toFixed(2));
  const totalAmount = Number((totalBase + gstAmount).toFixed(2));

  return {
    status: pricing_type,
    num_days: numDays,
    total_base_amount: totalBase,
    gst_rate: GST_RATE,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    rooms: breakdown,
  };
}

}
