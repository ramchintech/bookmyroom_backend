import { IsOptional, IsNumber } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional() @IsNumber() numberofguest?: number;
  @IsOptional() @IsNumber() deposite?: number;
  @IsOptional() aadhar_number?: any; 

}
