import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Programme, STATUTS_PROGRAMME, StatutProgramme } from '../../domaine/programme';

export class ReglerProgrammeDto {
  @ApiPropertyOptional({ description: 'Seulement pour un programme ajouté par l’administrateur' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: STATUTS_PROGRAMME })
  @IsOptional()
  @IsIn(STATUTS_PROGRAMME)
  status?: StatutProgramme;

  @ApiPropertyOptional({ description: 'Visible pour les membres' })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiPropertyOptional({ description: 'Résumé ; vide pour revenir au texte d’origine' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Explication ; vide pour revenir au texte d’origine' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  overview?: string;
}

export class AjouterProgrammeDto {
  @ApiProperty({ example: 'custom-lx2k9a3f', description: 'Choisi par l’interface, commence par "custom-"' })
  @IsString()
  @Matches(/^custom-[a-z0-9-]{1,60}$/)
  code: string;

  @ApiProperty({ example: 'financer', description: 'Code du pilier' })
  @IsString()
  group: string;

  @ApiProperty({ example: 'Club Épargne Jeunes' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: STATUTS_PROGRAMME })
  @IsIn(STATUTS_PROGRAMME)
  status: StatutProgramme;

  @ApiProperty()
  @IsBoolean()
  visible: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  overview?: string;
}

export function versReponseProgramme(programme: Programme) {
  return {
    id: programme.id,
    code: programme.code,
    group: programme.pilierCode,
    name: programme.nom,
    minimumLevelId: programme.niveauMinimumRequisId,
    status: programme.statut,
    visible: programme.visible,
    summary: programme.resume,
    overview: programme.explication,
    custom: programme.ajouteParAdmin,
  };
}
