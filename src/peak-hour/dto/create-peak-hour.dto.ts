import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePeakHourDto {
  @IsNumber()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;


}
