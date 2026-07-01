import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMultipleDefaultValuesDto {
  @IsString()
  user_id: string;

  @IsInt()
  lodge_id: number;

  @IsString()
  type: string; // "Rent"

  @IsNotEmpty()
  defaults: {
    reason: string;  // Room name/type
    amount: number;
  }[];
}
