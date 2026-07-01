import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateInstructionDto {
  @IsInt()
  lodge_id: number;

  @IsString()
  @IsOptional()
  instruction?: string;
}
