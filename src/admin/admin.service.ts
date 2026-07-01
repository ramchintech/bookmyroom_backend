import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
  // ====== Admin table ======

  // Get all admins for a lodge
  async findAllAdminsByLodge(lodgeId: number) {
    const admins = await prisma.admin.findMany({
      where: { lodge_id: lodgeId },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        name: true,
        designation: true,
        phone: true,
        email: true,
      },
    });

    if (!admins.length)
      throw new NotFoundException(`No admins found for lodge ID ${lodgeId}`);
    return admins;
  }

  // Get one admin by lodge + user_id
  async findAdminByLodge(lodgeId: number, userId: string) {
    const admin = await prisma.admin.findUnique({
      where: {
        user_id_lodge_id: {
          lodge_id: lodgeId,
          user_id: userId,
        },
      },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        name: true,
        designation: true,
        phone: true,
        email: true,
      },
    });

    if (!admin)
      throw new NotFoundException(
        `Admin with user ID ${userId} not found in lodge ${lodgeId}`,
      );
    return admin;
  }

  // ====== Administrator table ======

  // Get all administrators for a lodge
  async findAllAdministratorsByLodge(lodgeId: number) {
    const administrators = await prisma.administrator.findMany({
      where: { lodge_id: lodgeId },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!administrators.length)
      throw new NotFoundException(
        `No administrators found for lodge ID ${lodgeId}`,
      );
    return administrators;
  }

  // Get one administrator by lodge + user_id
  async findAdministratorByLodge(lodgeId: number, userId: string) {
    const administrator = await prisma.administrator.findUnique({
      where: {
        user_id_lodge_id: {
          lodge_id: lodgeId,
          user_id: userId,
        },
      },
      select: {
        id: true,
        lodge_id: true,
        user_id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!administrator)
      throw new NotFoundException(
        `Administrator with user ID ${userId} not found in lodge ${lodgeId}`,
      );
    return administrator;
  }
}
