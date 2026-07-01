import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  lodge_id: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
