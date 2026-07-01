import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateInstructionDto {
  @IsInt()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  instruction: string;
}
