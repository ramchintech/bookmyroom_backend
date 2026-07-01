import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class BlockLodgeDto {
  @IsBoolean()
  block: boolean;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Reason should be at least 3 characters long' })
  reason?: string;
}
