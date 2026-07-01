import { Injectable, BadRequestException, NotFoundException ,InternalServerErrorException} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePreBookingDto } from './dto/pre-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateDateDto } from './dto/update-date.dto';

const prisma = new PrismaClient();

@Injectable()
export class BookingService {

async updateBookingDate(dto: UpdateDateDto) {
  const { booking_id, lodge_id, check_in, check_out, updated_rooms } = dto;

  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new BadRequestException("Invalid date format");
  }

  if (checkOutDate <= checkInDate) {
    throw new BadRequestException("Checkout cannot be before checkin");
  }

  const numericBookingId = Number(booking_id);
  const numericLodgeId = Number(lodge_id);

  // 1️⃣ Find old booking
  const oldBooking = await prisma.booking.findFirst({
    where: {
      booking_id: numericBookingId,
      lodge_id: numericLodgeId,
    },
  });

  if (!oldBooking) {
    throw new NotFoundException("Booking not found");
  }

  try {
    // 2️⃣ Convert incoming format → [["Room Name","Type",[rooms]]]
    const formattedRooms = updated_rooms.map(r => [
      r.room_name,
      r.room_type,
      r.rooms
    ]);

    // 3️⃣ Update booking using composite key
    const updated = await prisma.booking.update({
      where: {
        booking_id_lodge_id: {
          booking_id: numericBookingId,
          lodge_id: numericLodgeId,
        },
      },
      data: {
        check_in: checkInDate,
        check_out: checkOutDate,

        // Replace old booked rooms with new formatted array
        booked_room: formattedRooms,
      },
    });

    // 4️⃣ Return updated booking
    return {
      message: "Booking updated successfully",
      update_booking: updated,
    };
  } catch (err) {
    console.error(err);
    throw new InternalServerErrorException("Failed to update booking");
  }
}

 async createBooking(dto: CreateBookingDto) {
  const {
    lodge_id,
    user_id,
    rooms,
    booked_rooms,
    id_proofs,
    specification,
    balance,
    numberofguest,
    baseamount,
    gst,
    aadhar_number,
    amount,
    advance,
    deposite,
    check_in,
    check_out,
    ...rest
  } = dto;

  if (!id_proofs || id_proofs.length === 0) {
    throw new BadRequestException('At least one ID proof is required');
  }

  // Convert numeric and date fields
  const numericBalance = Number(balance);
  const numericBaseAmount = Number(baseamount);
  const numericDeposite = Number(deposite);
  const numericGst = Number(gst);
  const numericAmount = Number(amount);
  const numericAdvance = Number(advance);
  const numericGuests = Number(numberofguest);
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);

  // Auto-increment booking_id per lodge
  const lastBooking = await prisma.booking.findFirst({
    where: { lodge_id },
    orderBy: { booking_id: 'desc' },
    select: { booking_id: true },
  });
  const newBookingId = lastBooking ? lastBooking.booking_id + 1 : 1;
const roomAmountJson = dto.rooms.map(room => ({
  room_name: room.room_name,
  room_type: room.room_type,
  room_count: room.room_count,
  base_amount_per_room: room.base_amount_per_room,
  group_total_base_amount: room.group_total_base_amount,
}));

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      booking_id: newBookingId,
      lodge_id,
      user_id,
      ...rest,
      numberofguest: numericGuests,
      Balance: numericBalance,
      baseamount: numericBaseAmount,
      gst: numericGst,
      amount: numericAmount,
      advance: numericAdvance,
      deposite: numericDeposite,
      check_in: checkInDate,
      check_out: checkOutDate,
      status: 'BOOKED',
      room_amount: roomAmountJson,  // ✅ plain objects now
      booked_room:booked_rooms,   // nested array
      id_proof: id_proofs,
      aadhar_number: aadhar_number || [],
      specification,
    },
  });

  // Create income records for advance
  if (numericAdvance > 0) {
    await prisma.income.create({
      data: {
        lodge_id,
        user_id,
        reason: `Payment for booking #${booking.booking_id}`,
        amount: numericAdvance,
        type: "BOOKING",
      },
    });
  }

  // Create income record for deposit
  if (numericDeposite > 0) {
    await prisma.income.create({
      data: {
        lodge_id,
        user_id,
        reason: `Deposit for booking #${booking.booking_id}`,
        amount: numericDeposite,
        type: "BOOKING",
      },
    });
  }

  return booking;
}

async updateBooking(
  lodgeId: number,
  bookingId: number,
  dto: UpdateBookingDto,
  aadhar_number: string[],
  newIdProofs: string[],
) {
  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { booking_id_lodge_id: { booking_id: bookingId, lodge_id: lodgeId } },
    });

    if (!existingBooking) {
      throw new BadRequestException('Booking not found');
    }

    const existingProofs = Array.isArray(existingBooking.id_proof)
      ? existingBooking.id_proof
      : [];

    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id_lodge_id: {
          booking_id: bookingId,
          lodge_id: lodgeId,
        },
      },
      data: {
        numberofguest:
          dto.numberofguest !== undefined
            ? Number(dto.numberofguest)
            : existingBooking.numberofguest,

        deposite:
          dto.deposite !== undefined
            ? Number(dto.deposite)
            : existingBooking.deposite,

        aadhar_number: aadhar_number ?? existingBooking.aadhar_number,

        id_proof: [...existingProofs, ...newIdProofs],

        status: 'BOOKED',
      },
    });

    return updatedBooking;
  } catch (err) {
    console.error('Error updating booking:', err);
    throw new InternalServerErrorException('Failed to update booking');
  }
}

async createPreBooking(dto: CreatePreBookingDto) {
  const {
    lodge_id,
    user_id,
    rooms,
    booked_rooms,
    specification,
    balance,
    payment_method,
    baseamount,
    gst,
    amount,
    advance,
    check_in,
    check_out,
    name,
    phone,
    address,
    numberofguest,
    email,
    alternate_phone,
  } = dto;

  try {
    // Convert numeric fields
    const numericBalance = Number(balance) || 0;
    const numericBaseAmount = Number(baseamount) || 0;
    const numericGst = Number(gst) || 0;
    const numericAmount = Number(amount) || 0;
    const numericAdvance = Number(advance) || 0;
    const numericGuests = Number(numberofguest) || 0;

    // Convert dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BadRequestException('Invalid check_in or check_out date');
    }
    const lodgeIdNumber = Number(lodge_id);
if (isNaN(lodgeIdNumber)) {
  throw new BadRequestException('Invalid lodge_id. Must be a number.');
}

    // Parse specification safely
    const specObj = specification || {};

    // Auto-increment booking_id per lodge
    const lastBooking = await prisma.booking.findFirst({
  where: { lodge_id: lodgeIdNumber },
      orderBy: { booking_id: 'desc' },
      select: { booking_id: true },
    });
    const newBookingId = lastBooking ? lastBooking.booking_id + 1 : 1;

    // Prepare room_amount JSON from rooms array
    const roomAmountJson = Array.isArray(rooms)
      ? rooms.map(room => ({
          room_name: room.room_name,
          room_type: room.room_type,
          room_count: room.room_count,
          base_amount_per_room: room.base_amount_per_room,
          group_total_base_amount: room.group_total_base_amount,
        }))
      : [];

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        booking_id: newBookingId,
        lodge_id: lodgeIdNumber, // ✅ Use the number here
        user_id,
        name,
        phone,
        address,
        payment_method,
        email: email || '',
        alternate_phone: alternate_phone || '',
        room_amount: roomAmountJson,
        booked_room: booked_rooms || [],
        specification: specObj,
        Balance: numericBalance,
        baseamount: numericBaseAmount,
        gst: numericGst,
        amount: numericAmount,
        advance: numericAdvance,
        check_in: checkInDate,
        check_out: checkOutDate,
        status: 'PREBOOKED',
        numberofguest: numericGuests,
    
      },
    });

    // Record advance if any
    if (numericAdvance > 0) {
      await prisma.income.create({
        data: {
      lodge_id: lodgeIdNumber, // ✅ convert to number
          user_id,
          reason: `Payment for pre-booking #${booking.booking_id}`,
          amount: numericAdvance,
          type: 'PREBOOK',
        },
      });
    }

    return booking;
  } catch (error) {
    console.error('PreBooking creation failed:', error);
    throw new BadRequestException('Internal Server Error. Check server logs.');
  }
}

async getPreBookedData(lodgeId: number, nowString: string) {
  if (!nowString) {
    throw new BadRequestException("Missing 'now' query parameter");
  }

  // Convert incoming date string to a date-only range
  const date = new Date(nowString);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  return prisma.booking.findMany({
    where: {
      lodge_id: lodgeId,
      status: "PREBOOKED",
      check_in: { lte: endOfDay },   // check_in is before or on this date
      check_out: { gte: startOfDay }, // check_out is on or after this date
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

 async getLatestBookingByPhone(lodgeId: number, phone: string) {
    if (!lodgeId || !phone) {
      throw new BadRequestException('lodgeId and phone are required');
    }

    // Fetch the latest booking for the given phone and lodge
    const latestBooking = await prisma.booking.findFirst({
      where: {
        lodge_id: lodgeId,
        phone: phone,
      },
      orderBy: {
        created_at: 'desc', // newest first
      },
      select: {
        name: true,
        phone: true,
        alternate_phone: true,
        email: true,
        address: true,
      },
    });

    if (!latestBooking) {
      throw new NotFoundException('No booking found for this phone number');
    }

    return latestBooking;
}

async checkAvailability(data: {
  lodge_id: number;
  check_in: string | Date;
  check_out: string | Date;
  room_requests: { room_name: string; room_type: string; count: number }[];
}) {
  const { lodge_id, check_in, check_out, room_requests } = data;

  const checkIn = new Date(check_in);
  const checkOut = new Date(check_out);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
    throw new BadRequestException("Invalid date range");
  }

  // 1️⃣ Fetch all rooms in lodge
  const allRooms = await prisma.rooms.findMany({
    where: { lodge_id },
    select: { room_name: true, room_type: true, room_number: true },
  });

  // Group rooms
  const roomGroups = new Map<
    string,
    { room_name: string; room_type: string; rooms: string[] }
  >();

  allRooms.forEach((room) => {
    const key = `${room.room_name}-${room.room_type}`;
    const nums = Array.isArray(room.room_number)
      ? room.room_number.map(String)
      : [String(room.room_number)];

    if (!roomGroups.has(key)) {
      roomGroups.set(key, { room_name: room.room_name, room_type: room.room_type, rooms: nums });
    } else {
      roomGroups.get(key)!.rooms.push(...nums);
    }
  });

  // 2️⃣ Fetch bookings overlapping given time
  const bookedRooms = new Set<string>();

  const bookings = await prisma.booking.findMany({
    where: {
      lodge_id,
      status: { in: ["BOOKED", "PREBOOKED", "BILLED"] },
      check_in: { lt: checkOut },
      check_out: { gt: checkIn },
    },
    select: { booked_room: true },
  });

  bookings.forEach((b) => {
    if (Array.isArray(b.booked_room)) {
      b.booked_room.forEach((entry: any) => {
        const roomNums = entry[2]; // [name, type, [numbers]]
        if (Array.isArray(roomNums)) {
          roomNums.forEach((n: any) => bookedRooms.add(String(n)));
        } else if (roomNums) {
          bookedRooms.add(String(roomNums));
        }
      });
    }
  });

  // 3️⃣ Check each requested category
  const availabilityResult: any[] = [];
  let allAvailable = true;

  for (const req of room_requests) {
    const key = `${req.room_name}-${req.room_type}`;
    const group = roomGroups.get(key);

    if (!group) {
      allAvailable = false;
      availabilityResult.push({
        room_name: req.room_name,
        room_type: req.room_type,
        required: req.count,
        available: 0,
        rooms: [],
        message: "Room category not found in lodge",
      });
      continue;
    }

    const freeRooms = group.rooms.filter((r) => !bookedRooms.has(r));

    const availableCount = freeRooms.length;

    if (availableCount < req.count) {
      allAvailable = false;
    }

    availabilityResult.push({
      room_name: req.room_name,
      room_type: req.room_type,
      required: req.count,
      available: availableCount,
      rooms: freeRooms.slice(0, req.count), // rooms that can be allocated
      message:
        availableCount >= req.count
          ? "Available"
          : "Not enough rooms available",
    });
  }

  return {
    success: true,
    all_available: allAvailable,
    details: availabilityResult,
  };
}

}
