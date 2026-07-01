import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID')!;
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')!;
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE') || '+16267142866';

    this.client = twilio(accountSid, authToken);
  }

  async sendOtpSms(phone: string, otp: string) {
    const to = phone.startsWith('+') ? phone : `+91${phone}`;
    const body = `Your Ramchin Lodge Management verification code is ${otp}. Do not share this with anyone.`;

    const message = await this.client.messages.create({
      body,
      from: this.fromNumber, // ✅ now correctly set
      to,
    });

    return message.sid;
  }
}
