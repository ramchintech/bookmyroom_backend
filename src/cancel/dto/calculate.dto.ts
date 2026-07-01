import { IsNotEmpty, IsNumber, IsDateString, IsInt } from 'class-validator';

export class CalculateCancelDto {
  @IsNotEmpty()
  @IsInt()
  bookingId: number;

  @IsNotEmpty()
  @IsNumber()
  baseAmount: number;

  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @IsNotEmpty()
  @IsInt()
  lodgeId: number; // Needed to fetch defaults & peak hours
}
