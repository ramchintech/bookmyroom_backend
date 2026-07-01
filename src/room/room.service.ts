// src/rooms/room.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

const prisma = new PrismaClient();

@Injectable()
export class RoomsService {
  // 🟢 Create a new room
  async create(dto: CreateRoomDto) {
    const room = await prisma.rooms.create({
      data: {
        user_id: dto.user_id,
        lodge_id: dto.lodge_id,
        room_name: dto.room_name,
        room_type: dto.room_type,
        room_number: dto.room_number,
      },
    });
    return { message: '✅ Room created successfully', room };
  }

  // 🔹 Get all rooms
  async findAll() {
    return prisma.rooms.findMany({
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        room_name: true,
        room_type: true,
        room_number: true,
      },
    });
  }

  // 🔹 Get all rooms for a specific lodge
  async findByLodgeId(lodge_id: number) {
    return prisma.rooms.findMany({
      where: { lodge_id },
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        room_name: true,
        room_type: true,
        room_number: true,
      },
    });
  }

  // 🔹 Get one room by ID + lodge_id
  async findOne(id: number, lodge_id: number) {
    const room = await prisma.rooms.findFirst({
      where: { id, lodge_id },
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        room_name: true,
        room_type: true,
        room_number: true,
      },
    });
    if (!room) throw new NotFoundException(`Room with ID ${id} not found`);
    return room;
  }

  // 🟡 Update a room
  async update(id: number, lodge_id: number, dto: UpdateRoomDto) {
    const room = await prisma.rooms.findFirst({ where: { id, lodge_id } });
    if (!room) throw new NotFoundException(`Room with ID ${id} not found`);

    const updated = await prisma.rooms.update({
      where: { id },
      data: {
        ...dto,
      },
    });
    return { message: '✅ Room updated successfully', updated };
  }

  // 🔴 Delete a room
  async delete(id: number, lodge_id: number) {
    const room = await prisma.rooms.findFirst({ where: { id, lodge_id } });
    if (!room) throw new NotFoundException(`Room with ID ${id} not found`);

    await prisma.rooms.delete({ where: { id } });
    return { message: '🗑️ Room deleted successfully' };
  }
}
