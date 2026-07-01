import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDefaultValueDto } from './dto/create-default-value.dto';
import { UpdateDefaultValueDto } from './dto/update-default-value.dto';
import { CreateMultipleDefaultValuesDto} from './dto/create-multiple-values.dto';


const prisma = new PrismaClient();

@Injectable()
export class DefaultValueService {

async createMultiple(createMultipleDto: CreateMultipleDefaultValuesDto) {
  const { user_id, lodge_id, type, defaults } = createMultipleDto;

  const createdDefaults = await prisma.$transaction(
    defaults.map(d =>
      prisma.defaultValue.create({
        data: {
          user_id,
          lodge_id,
          type,
          reason: d.reason,
          amount: d.amount,
        },
        select: {
          id: true,
          user_id: true,
          lodge_id: true,
          type: true,
          reason: true,
          amount: true,
        },
      })
    )
  );

  return createdDefaults;
}

  // 🔹 1️⃣ Get all default values
  async findAll() {
    return prisma.defaultValue.findMany({
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        type: true,
        reason: true,
        amount: true,
      },
    });
  }

  // 🔹 2️⃣ Get all default values for a specific lodge
  async findByLodgeId(lodge_id: number) {
    return prisma.defaultValue.findMany({
      where: { lodge_id },
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        type: true,
        reason: true,
        amount: true,
      },
    });
  }

  // 🔹 3️⃣ Get a single default value by ID + lodge_id
  async findOne(id: number, lodge_id: number) {
    return prisma.defaultValue.findFirst({
      where: { id, lodge_id },
      select: {
        id: true,
        user_id: true,
        lodge_id: true,
        type: true,
        reason: true,
        amount: true,
      },
    });
  }

  // 🔹 4️⃣ Create a new default value
  async create(data: CreateDefaultValueDto) {
    return prisma.defaultValue.create({
      data,
    });
  }

  // 🔹 5️⃣ Update a default value
  async update(id: number, lodge_id: number, data: UpdateDefaultValueDto) {
    return prisma.defaultValue.updateMany({
      where: { id, lodge_id },
      data,
    });
  }

  // 🔹 6️⃣ Delete a default value
  async remove(id: number, lodge_id: number) {
    return prisma.defaultValue.deleteMany({
      where: { id, lodge_id },
    });
  }
}
