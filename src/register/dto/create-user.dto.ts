import { IsNotEmpty, IsEmail, IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateLodgeAdminDto {
  // Lodge fields
  @IsString()
  @IsNotEmpty()
  lodge_name: string;

  @IsString()
  @IsNotEmpty()
  lodge_phone: string;

  @IsEmail()
  lodge_email: string;

  @IsString()
  @IsNotEmpty()
  lodge_address: string;

  @IsOptional()
  @IsString() // You’ll convert to Buffer when saving to Prisma
  lodge_logo: string;

  // ✅ Optional lodge_id (for lookups or testing)
  @IsOptional()
  @IsNumber()
  lodge_id: number;

  // User fields (used for login)
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // Admin profile fields
  @IsString()
  @IsNotEmpty()
  admin_name: string;

  @IsString()
  @IsNotEmpty()
  admin_phone: string;

  @IsEmail()
  admin_email: string;

}
