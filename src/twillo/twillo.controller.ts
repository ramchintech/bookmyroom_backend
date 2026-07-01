// src/auth/auth.controller.ts
import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { TwilioService } from '../twillo/twillo.service';

interface SendOtpDto { phone: string; }
interface VerifyOtpDto { phone: string; otp: string; }

@Controller('twilio')
export class TwilioController {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();
  // OTP lifetime in ms
  private OTP_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly twilioService: TwilioService) {}

  private generateOtp() {
    return (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit
  }

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    const phone = dto.phone;
    if (!phone) {
      throw new HttpException('phone required', HttpStatus.BAD_REQUEST);
    }

    const otp = this.generateOtp();
    const expiresAt = Date.now() + this.OTP_TTL;
    this.otpStore.set(phone, { otp, expiresAt });

    // auto delete after TTL
    setTimeout(() => {
      const entry = this.otpStore.get(phone);
      if (entry && entry.expiresAt <= Date.now()) this.otpStore.delete(phone);
    }, this.OTP_TTL + 1000);

    try {
      const sid = await this.twilioService.sendOtpSms(phone, otp);
      return { success: true, message: 'OTP sent', sid };
    } catch (err) {
      console.error('Twilio send error', err);
      throw new HttpException('Failed to send OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const phone = dto.phone;
    const otp = dto.otp;
    if (!phone || !otp) {
      throw new HttpException('phone and otp required', HttpStatus.BAD_REQUEST);
    }

    const stored = this.otpStore.get(phone);
    if (!stored) {
      return { success: false, message: 'OTP expired or not sent' };
    }

    if (stored.expiresAt < Date.now()) {
      this.otpStore.delete(phone);
      return { success: false, message: 'OTP expired' };
    }

    if (stored.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // OK verified — remove OTP so it can't be reused
    this.otpStore.delete(phone);
    return { success: true, message: 'OTP verified' };
  }
}
