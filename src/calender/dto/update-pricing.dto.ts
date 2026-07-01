import { IsNotEmpty, IsNumber, IsString, IsArray, ArrayNotEmpty } from "class-validator";

export class UpdatePricingDto {

  @IsNumber()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  pricing_type: string;  // "NORMAL" | "PEAK_HOUR"

  @IsString()
  @IsNotEmpty()
  check_in: string;

  @IsString()
  @IsNotEmpty()
  check_out: string;

  @IsArray()
  @ArrayNotEmpty()
  rooms: any[];
}
