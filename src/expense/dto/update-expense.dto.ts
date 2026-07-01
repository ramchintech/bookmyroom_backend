import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateExpenseDto {
//   @IsOptional()
//   @Transform(({ value }) => Number(value))
//   @IsNumber()
//   lodge_id?: number;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount?: number;
}
