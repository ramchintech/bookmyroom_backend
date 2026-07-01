import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDrawingDto {
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
  @Transform(({ value }) => Number(value))
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  type?: string;
}
