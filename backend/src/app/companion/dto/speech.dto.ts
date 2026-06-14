import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Speech {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsOptional()
  voiceId?: string;
}
