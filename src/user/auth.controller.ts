import type { Response } from 'express';
import { 
  Controller, 
  Post, 
  Body, 
  Res, 
  BadRequestException 
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  // 🔹 LOGIN
  @Post('login')
 async login(@Body() body: any, @Res() res: Response) {
  if (!body || body.userId === undefined || !body.password) {
    return res.status(400).json({
      success: false,
      message: 'userId and password are required',
    });
  }

  try {
    const lodgeId = body.lodgeId ? Number(body.lodgeId) : 0; // default 0 if missing
    const userId = String(body.userId); // Prisma user_id is String
    const password = body.password;

    const result = await this.userService.login(lodgeId, userId, password);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Login failed',
    });
  }
}


  // 🔹 CHANGE PASSWORD (logged-in user)
  @Post('change-password')
  async changePassword(@Body() body: any, @Res() res: Response) {
    const { lodgeId, userId, oldPassword, newPassword } = body;

    if (!userId) { 
      return res.status(400).json({ success: false, message: 'userId is required' }); 
    }
     if (!oldPassword) {
       return res.status(400).json({ success: false, message: 'oldPassword is required' });
    } 
    if (!newPassword) { 
      return res.status(400).json({ success: false, message: 'newPassword is required' });
    }

    try {
      const result = await this.userService.changePassword(
        Number(lodgeId),
        String(userId),
        oldPassword,
        newPassword,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  // 🔹 SEND OTP (forgot password)
  @Post('send_otp')
  async sendOtp(@Body() body: { lodgeId: number; userId: string; otp: string }) {
    const { lodgeId, userId, otp } = body;

    if (!lodgeId || lodgeId <= 0) {
      throw new BadRequestException({ status: 'error', message: 'lodgeId is required' });
    }
    if (!userId) {
      throw new BadRequestException({ status: 'error', message: 'userId is required' });
    }
    if (!otp) {
      throw new BadRequestException({ status: 'error', message: 'OTP is required' });
    }

    return this.userService.sendOtp(lodgeId, userId, otp);
  }

  // 🔹 UPDATE PASSWORD (after OTP verification)
  @Post('update_password')
  async updatePassword(@Body() body: { lodgeId: number; userId: string; newPassword: string }) {
    const { lodgeId, userId, newPassword } = body;

    if (!lodgeId || lodgeId <= 0) {
      throw new BadRequestException({ status: 'error', message: 'lodgeId is required' });
    }
    if (!userId) {
      throw new BadRequestException({ status: 'error', message: 'userId is required' });
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException({
        status: 'error',
        message: 'Password must be at least 6 characters long',
      });
    }

    return this.userService.updatePassword(lodgeId, userId, newPassword);
  }
}
