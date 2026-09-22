import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublierAnnonceDto {
  @ApiProperty({ example: '1er DBC Tour — Yaoundé' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Rendez-vous le 15 du mois...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Restreindre aux membres de ce niveau minimum' })
  @IsOptional()
  @IsInt()
  targetLevelId?: number;
}
