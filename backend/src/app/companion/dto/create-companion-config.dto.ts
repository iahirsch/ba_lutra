import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class FurColorDto {
  @ApiProperty({ example: '#897366' })
  @IsString()
  @IsNotEmpty()
  primary!: string;

  @ApiProperty({ example: '#D9B6A3' })
  @IsString()
  @IsNotEmpty()
  secondary!: string;
}

export class CreateCompanionConfigDto {
  @ApiPropertyOptional({ example: 'My Lutra' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: FurColorDto })
  @ValidateNested()
  @Type(() => FurColorDto)
  furColor!: FurColorDto;

  @ApiProperty({ example: 'eyes01' })
  @IsString()
  @IsNotEmpty()
  eyes!: string;

  @ApiProperty({ example: '#212121' })
  @IsString()
  @IsNotEmpty()
  noseColor!: string;

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

  @ApiPropertyOptional({ example: { body_fat: 0.5, face_fat: 0.5 } })
  @IsOptional()
  @IsObject()
  bodyMorphs?: Record<string, number>;
}
