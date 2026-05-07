import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanionConfigDto {
  @ApiPropertyOptional({ example: 'My Lutra' })
  @IsOptional()
  @IsString()
  name?: string;

  //TODO: Change @IsOptional back to @IsNotEmpty when all assets exist
  @ApiProperty({ example: 'fur01' })
  @IsString()
  @IsOptional()
  fur!: string;

  @ApiProperty({ example: 'eyes01' })
  @IsString()
  @IsNotEmpty()
  eyes!: string;

  @ApiProperty({ example: 'nose01' })
  @IsString()
  @IsNotEmpty()
  nose!: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  clothing?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  ears?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  tail?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  backpack?: string;

  @ApiPropertyOptional({ example: { chubby: 0.5 } })
  @IsOptional()
  @IsObject()
  bodyMorphs?: Record<string, number>;
}
