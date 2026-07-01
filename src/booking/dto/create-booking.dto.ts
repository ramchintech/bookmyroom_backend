import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsArray, 
  IsDate, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

export class SpecificationDto {
  @IsNumber()
  number_of_days: number;

  @IsNumber()
  number_of_rooms: number;
}

export class RoomGroupDto {
  @IsString()
  @IsNotEmpty()
  room_name: string;

  @IsString()
  @IsNotEmpty()
  room_type: string;

  @IsNumber()
  room_count: number;

  @IsNumber()
  base_amount_per_room: number;

  @IsNumber()
  group_total_base_amount: number;
}

export class CreateBookingDto {
  @IsNumber()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  alternate_phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  numberofguest: number;

  @IsOptional()
  specification?: any; // <-- Change to any to pass JSON to Prisma

  @IsDate()
  @Type(() => Date)
  check_in: Date;

  @IsDate()
  @Type(() => Date)
  check_out: Date;

  @IsNumber()
  baseamount: number;

  @IsNumber()
  gst: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  advance: number;

  @IsNumber()
  balance: number;

  @IsString()
  @IsOptional()
  payment_method: string;
  
  @IsNumber()
  deposite: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomGroupDto)
  rooms: RoomGroupDto[];

  @IsArray()
  booked_rooms: any[]; // You can specify nested array type if you want

  @IsArray()
  @IsString({ each: true })
  id_proofs: string[];

  @IsOptional()
  aadhar_number?: string[]; // <-- Add this to fix TS error
}
