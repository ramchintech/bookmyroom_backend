// src/rooms/dto/create-room.dto.ts
import { IsNotEmpty, IsString, IsInt, IsJSON, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsInt()
  lodge_id: number;

  @IsNotEmpty()
  @IsString()
  room_name: string;

  @IsNotEmpty()
  @IsString()
  room_type: string;

  @IsNotEmpty()
  room_number: any; // can be JSON (array/object)

  // Optional additional validation if needed:
  // @IsJSON()
  // room_number: string;
}
