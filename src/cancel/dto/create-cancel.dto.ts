// src/cancels/dto/calculate-cancel.dto.ts
import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCancelDto {
  @IsInt()
  bookingId: number;

  @IsInt()
  lodgeId: number;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNumber()
  amountPaid?: number;

  @IsNumber()
  cancelCharge?: number;

  @IsNumber()
  refund?: number;
}
