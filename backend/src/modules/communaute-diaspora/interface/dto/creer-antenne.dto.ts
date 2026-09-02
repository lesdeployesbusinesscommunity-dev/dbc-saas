import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STATUTS_ANTENNE, StatutAntenne } from '../../domaine/antenne';

export class CreerAntenneDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  zoneId: number;

  @ApiProperty({ example: 'Bafoussam' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ enum: STATUTS_ANTENNE, example: 'preparation' })
  @IsOptional()
  @IsString()
  status?: StatutAntenne;
}
