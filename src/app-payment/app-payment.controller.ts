import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { AppPaymentService } from './app-payment.service';
import { AppPaymentStatus } from '@prisma/client';

@Controller('api/app-payment')
export class AppPaymentController {
  constructor(private readonly appPaymentService: AppPaymentService) {}

  // ✅ Create yearly payment
  @Post('create/:lodgeId')
  async createPayment(
    @Param('lodgeId', ParseIntPipe) lodgeId: number,
    @Body('transactionId') transactionId?: string,
  ) {
    return this.appPaymentService.createYearlyPayment(lodgeId, transactionId);
  }

  // ✅ Update payment status
  @Post('update-status/:paymentId')
  async updateStatus(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() body: { status: AppPaymentStatus; transactionId?: string },
  ) {
    return this.appPaymentService.updatePaymentStatus(
      paymentId,
      body.status,
      body.transactionId,
    );
  }

  // ✅ Get current/latest payment
  @Get('current/:lodgeId')
  async getCurrentPayment(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.appPaymentService.getCurrentPayment(lodgeId);
  }

  // ✅ Get payment history
  @Get('history/:lodgeId')
  async getPaymentHistory(@Param('lodgeId', ParseIntPipe) lodgeId: number) {
    return this.appPaymentService.getPaymentHistory(lodgeId);
  }

  // ✅ Expire old payments manually
  @Post('expire')
  async expireOldPayments() {
    return this.appPaymentService.expireOldPayments();
  }
}
