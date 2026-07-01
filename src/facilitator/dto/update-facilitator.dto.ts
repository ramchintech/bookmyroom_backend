import { IsOptional, IsNumber, IsString } from 'class-validator';

export class UpdateFacilitatorDto {
  @IsOptional()
  @IsNumber()
  lodge_id?: number;

  @IsOptional()
  @IsString()
  facility?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
