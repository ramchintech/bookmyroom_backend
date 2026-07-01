import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class PartialCancelDto {
  @IsInt()
  bookingId: number;

  @IsInt()
  lodgeId: number;
  
  @IsString()
  userId: string;

  roomNumbers: any[];   
  
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  amountPaid?: number;  
  
  @IsOptional()
  @IsNumber()
  cancelCharge?: number;
  
  @IsOptional()
  @IsNumber()
  refund?: number;
}
