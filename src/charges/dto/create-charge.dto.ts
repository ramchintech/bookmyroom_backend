import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateChargesDto {
  @IsNotEmpty()
  @IsNumber()
  booking_id: number;

  @IsNotEmpty()
  @IsNumber()
  lodge_id: number;

  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
