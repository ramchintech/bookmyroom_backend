// src/rooms/dto/update-room.dto.ts
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsInt()
  lodge_id?: number;

  @IsOptional()
  @IsString()
  room_name?: string;

  @IsOptional()
  @IsString()
  room_type?: string;

  @IsOptional()
  room_number?: any; // can be JSON
}
