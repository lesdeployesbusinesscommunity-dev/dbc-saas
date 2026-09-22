import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreerFormationDto {
  @ApiProperty({ example: 'ecole-des-affaires', description: 'Code unique de la formation' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'École des Affaires DBC' })
  @IsString()
  titre: string;

  @ApiProperty({ example: 2, description: 'Id du niveau DBC minimum requis (voir GET /adhesion/niveaux)' })
  @IsInt()
  @Min(1)
  niveauRequisId: number;

  @ApiProperty({
    example: 'former',
    description: "Code du pilier (voir GET /programmes/piliers) — 'financer' · 'former' · 'reseauter' · 'investir'",
  })
  @IsString()
  pilierCode: string;
}
