// src/rooms/room.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomsService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // 🟢 Create room
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  // 🔹 Get all rooms
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  // 🔹 Get all rooms for a specific lodge
  @Get('lodge/:lodge_id')
  findByLodgeId(@Param('lodge_id', ParseIntPipe) lodge_id: number) {
    return this.roomsService.findByLodgeId(lodge_id);
  }

  // 🔹 Get one room by ID + lodge_id
  @Get(':id/:lodge_id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
  ) {
    return this.roomsService.findOne(id, lodge_id);
  }

  // 🟡 Update room
  @Patch(':id/:lodge_id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, lodge_id, dto);
  }

  // 🔴 Delete room
  @Delete(':id/:lodge_id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Param('lodge_id', ParseIntPipe) lodge_id: number,
  ) {
    return this.roomsService.delete(id, lodge_id);
  }
}
