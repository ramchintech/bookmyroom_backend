import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateChargesDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
