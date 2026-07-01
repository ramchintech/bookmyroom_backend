import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLodgeAdminDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface OtpRecord {
  otp: string;
  expiresAt: number;
}

@Injectable()
export class RegisterService {
  private otpStore = new Map<string, OtpRecord>(); // email → OTP mapping

async createLodgeWithAdmin(dto: CreateLodgeAdminDto) {
  const {
    lodge_id,
    lodge_name,
    lodge_phone,
    lodge_email,
    lodge_address,
    user_id,
    password,
    admin_name,
    admin_phone,
    admin_email,
    lodge_logo,
  } = dto;

  const logoBuffer = lodge_logo ? Buffer.from(lodge_logo, 'base64') : undefined;

  // ✅ 1. Check if lodge_id already exists
  const existingLodge = await prisma.lodge.findUnique({
    where: { lodge_id },
  });

  if (existingLodge) {
    throw new BadRequestException(`Lodge ID ${lodge_id} already exists`);
  }

  // ✅ 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // ✅ 3. Create Lodge, User, and Admin
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + 2);

    // Create Lodge using provided ID
    const lodge = await tx.lodge.create({
      data: {
        lodge_id, // 👈 Use frontend-provided lodge_id
        name: lodge_name,
        phone: lodge_phone,
        email: lodge_email,
        address: lodge_address,
        logo: logoBuffer,
        duedate: dueDate,
      },
    });

    // Create User linked to Lodge
    const user = await tx.user.create({
      data: {
        user_id,
        lodge_id,
        password: hashedPassword,
        is_active: true,
        role: 'ADMIN',
      },
    });

    // Create Admin linked to Lodge
    const admin = await tx.admin.create({
      data: {
        lodge_id,
        user_id: user.user_id,
        name: admin_name,
        phone: admin_phone,
        email: admin_email,
        designation: 'Owner', // ✅ Always set from backend
      },
    });

    return {
      message: 'Lodge and Admin created successfully',
      lodge_id,
      lodge,
      user,
      admin,
    };
  });
}


  async findLodgeById(lodge_id: number) {
    return prisma.lodge.findUnique({ where: { lodge_id } });
  }

  // ✅ Send OTP
  async sendOtp(email: string, otp: string) {
    this.otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'Noreply.ramchintech@gmail.com',
        pass: 'zkvb rmyu yqtm ipgv', // Gmail app password
      },
    });

    const mailOptions = {
      from: 'Noreply.ramchintech@gmail.com',
      to: email,
      subject: 'Your Email Verification Code',
      text: `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { status: 'success', message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Email send error:', error);
      throw new BadRequestException({ status: 'error', message: 'Failed to send OTP email' });
    }
  }

  // ✅ Verify OTP
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = this.otpStore.get(email);
    if (!record) return false;
    if (record.otp !== otp) return false;
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email);
      return false;
    }
    this.otpStore.delete(email); // cleanup
    return true;
  }
}
