import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExpenseDto {
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  lodge_id: number;

  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount: number;
}
