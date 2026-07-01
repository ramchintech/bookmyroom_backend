import { Controller, Post, Body, Get, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { RegisterService } from './register.service';
import { CreateLodgeAdminDto } from './dto/create-user.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  // ✅ Create Lodge + Admin (same as createHallWithOwner)
  @Post('create')
  async createLodgeWithAdmin(@Body() dto: CreateLodgeAdminDto) {
    return this.registerService.createLodgeWithAdmin(dto);
  }

  // ✅ Check Lodge by ID (was check-hall)
  @Get('check-lodge/:lodge_id')
  async checkLodgeExists(@Param('lodge_id') lodge_id: number) {
    const lodge = await this.registerService.findLodgeById(+lodge_id);
    return { exists: !!lodge };
  }

  // ✅ Send OTP
  @Post('send_otp')
  async sendOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    if (!email || !otp) {
      throw new BadRequestException({
        status: 'error',
        message: 'Email and OTP are required',
      });
    }
    return this.registerService.sendOtp(email, otp);
  }

  // ✅ Verify OTP
  @Post('verify_otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    if (!email || !otp) {
      throw new BadRequestException({
        status: 'error',
        message: 'Email and OTP are required',
      });
    }

    const valid = await this.registerService.verifyOtp(email, otp);
    if (!valid) {
      throw new NotFoundException({
        status: 'error',
        message: 'Invalid or expired OTP',
      });
    }

    return { status: 'success', message: 'OTP verified successfully' };
  }
}
