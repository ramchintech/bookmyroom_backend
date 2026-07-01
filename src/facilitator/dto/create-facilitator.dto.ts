import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFacilitatorDto {
  @IsNumber()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  facility: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
