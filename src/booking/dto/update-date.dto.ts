import { IsNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateDateDto {
  @IsNotEmpty()
  booking_id: number;

  @IsNotEmpty()
  lodge_id: string;

  @IsNotEmpty()
  @IsString()
  check_in: string;

  @IsNotEmpty()
  @IsString()
  check_out: string;

  @IsArray()
  updated_rooms: {
    room_name: string;
    room_type: string;
    rooms: string[];
  }[];
}
