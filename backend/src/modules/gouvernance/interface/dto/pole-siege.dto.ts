import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiegeSaisiDto {
  @ApiPropertyOptional({ description: 'Id du siège existant à renommer ; absent pour un nouveau siège' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Operations Director' })
  @IsString()
  title: string;
}

export class CreerPoleDto {
  @ApiProperty({ example: 'Comité Stratégique' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Pilote les orientations stratégiques à moyen terme' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'briefcase' })
  @IsString()
  icon: string;

  @ApiProperty({ type: [SiegeSaisiDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiegeSaisiDto)
  seats: SiegeSaisiDto[];
}

export class ModifierPoleDto extends CreerPoleDto {}
