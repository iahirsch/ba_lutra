import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ColorDto {
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

  @ApiProperty({ type: ColorDto })
  @ValidateNested()
  @Type(() => ColorDto)
  furColor!: ColorDto;

  @ApiProperty({ type: ColorDto })
  @ValidateNested()
  @Type(() => ColorDto)
  eyeColor!: ColorDto;

  @ApiProperty({ example: '#212121' })
  @IsString()
  @IsNotEmpty()
  noseColor!: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  clothingTop?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  clothingBottom?: string;

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
