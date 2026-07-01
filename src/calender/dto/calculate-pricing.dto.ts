import { IsNumber, IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from "class-validator";

export class CalculatePricingDto {
  
  @IsNumber()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  check_in: string;

  @IsString()
  @IsNotEmpty()
  check_out: string;

  @IsArray()
  @ArrayNotEmpty()
  rooms: any[]; // [ [room_name, room_type, [numbers]] ]

  @IsNumber()
  @IsNotEmpty()
  override_base_amount?: number;
}
