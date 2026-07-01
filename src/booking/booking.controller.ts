import { Controller, Post, Body, UploadedFiles, UseInterceptors, BadRequestException, Req, Query, Param, ParseIntPipe, Get, Put} from '@nestjs/common';
import { BookingService } from './booking.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';
import type { Request } from 'express';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePreBookingDto } from './dto/pre-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateDateDto } from './dto/update-date.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Put('update-date')
  updateBookingDate(@Body() dto: UpdateDateDto) {
    return this.bookingService.updateBookingDate(dto);
  }
  @Post('check-availability')
  async checkAvailability(
    @Body() data: {
      lodge_id: number;
      check_in: string | Date;
      check_out: string | Date;
      room_requests: { room_name: string; room_type: string; count: number }[];
    },
  ) {
    if (!data.lodge_id || !data.check_in || !data.check_out || !data.room_requests) {
      throw new BadRequestException('Missing required fields');
    }

    const result = await this.bookingService.checkAvailability(data);
    return result;
  }

  @Post('create')
@UseInterceptors(
  FilesInterceptor('id_proofs', 100, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const lodgeId = req.body.lodge_id;
        if (!lodgeId) return cb(new BadRequestException('lodge_id is required'), '');
        const uploadPath = join('/var/www/lodge_image', lodgeId.toString(), 'idproof');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + extname(file.originalname));
      },
    }),
  }),
)
async createBooking(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: any, // use 'any' to parse JSON strings in multipart
  @Req() req: Request,
) {
  if (!files || files.length === 0) {
    throw new BadRequestException('At least one ID proof is required');
  }

  const lodgeId = Number(body.lodge_id);
  if (isNaN(lodgeId)) throw new BadRequestException('lodge_id must be a number');

  const protocol = req.protocol;
  const host = req.get('host');

  // Parse JSON fields safely
  const rooms = typeof body.rooms === 'string' ? JSON.parse(body.rooms) : body.rooms || [];
  const bookedRooms = typeof body.booked_rooms === 'string' ? JSON.parse(body.booked_rooms) : body.booked_rooms || [];
  const aadharNumbers = typeof body.aadhar_number === 'string' ? JSON.parse(body.aadhar_number) : body.aadhar_number || [];
  const specification = typeof body.specification === 'string' ? JSON.parse(body.specification) : body.specification || {};

  // Generate URLs for uploaded files
  const idProofUrls = files.map(
    f => `${protocol}://${host}/lodge_image/${lodgeId}/idproof/${f.filename}`,
  );

  // Build final DTO
  const createDto: CreateBookingDto = {
    ...body,
    lodge_id: lodgeId,
    rooms,
    booked_rooms: bookedRooms,
    aadhar_number: aadharNumbers,
    id_proofs: idProofUrls,
    specification,
  };

  const booking = await this.bookingService.createBooking(createDto);

  return { message: 'Booking created successfully', booking };
}


   @Put(':lodgeId/:bookingId')
  @UseInterceptors(
    FilesInterceptor('id_proofs', 100, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const lodgeId = req.params.lodgeId;
          if (!lodgeId) return cb(new BadRequestException('lodgeId is required'), '');
          const uploadPath = join('/var/www/lodge_image', lodgeId.toString(), 'idproof');
          if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  async updateBooking(
  @Param('lodgeId') lodgeId: string,
  @Param('bookingId') bookingId: string,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: UpdateBookingDto,
  @Req() req: Request,
) {
  if (!files || files.length === 0) {
    throw new BadRequestException('At least one ID proof is required');
  }

  const protocol = req.protocol;
  const host = req.get('host');

  let aadhaarNumbers: string[] = [];

  if (typeof body.aadhar_number === 'string') {
    try {
      aadhaarNumbers = JSON.parse(body.aadhar_number);
    } catch {
      throw new BadRequestException('Invalid aadhar_number format');
    }
  } else if (Array.isArray(body.aadhar_number)) {
    aadhaarNumbers = body.aadhar_number;
  }

  // Convert uploaded files to URLs
  const idProofUrls = files.map(
    f => `${protocol}://${host}/lodge_image/${lodgeId}/idproof/${f.filename}`,
  );

  const updatedBooking = await this.bookingService.updateBooking(
  Number(lodgeId),
  Number(bookingId),
  {
    ...body,
    aadhar_number: aadhaarNumbers,
  },
  aadhaarNumbers,
  idProofUrls,
);

  return { message: 'Booking updated successfully', booking: updatedBooking };
}


     @Post('pre-book')
 async createPreBooking(@Body() body: CreatePreBookingDto) {
  if (!body) {
    throw new BadRequestException('Request body is required');
  }

 const rooms = typeof body.rooms === 'string' ? JSON.parse(body.rooms) : body.rooms || [];
  const bookedRooms = typeof body.booked_rooms === 'string' ? JSON.parse(body.booked_rooms) : body.booked_rooms || [];
  const specification = typeof body.specification === 'string' ? JSON.parse(body.specification) : body.specification || {};


  const booking = await this.bookingService.createPreBooking({
       ...body,
    rooms,
    booked_rooms: bookedRooms,
    specification,
  });

  return { message: 'PreBooking created successfully', booking };
}


     @Get('latest/:lodgeId/:phone')
async getLatestBooking(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
  @Param('phone') phone: string,
) {
  return this.bookingService.getLatestBookingByPhone(lodgeId, phone);
}
@Get('prebooked/:lodgeId')
async getPreBooked(
  @Param('lodgeId', ParseIntPipe) lodgeId: number,
  @Query('now') now: string,   // 👈 receive date from frontend
) {
  return this.bookingService.getPreBookedData(lodgeId, now);
}


}
