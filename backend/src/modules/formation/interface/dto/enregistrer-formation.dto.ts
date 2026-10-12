import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OptionQuizDto {
  @ApiProperty({ example: 'a' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Les Déployés Business Community' })
  @IsString()
  text: string;
}

export class QuestionQuizDto {
  @ApiProperty({ example: 'q1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Que signifie DBC ?' })
  @IsString()
  text: string;

  @ApiProperty({ type: [OptionQuizDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionQuizDto)
  options: OptionQuizDto[];

  @ApiProperty({ example: ['a'], description: 'Ids des bonnes options (plusieurs = cases à cocher)' })
  @IsArray()
  @IsString({ each: true })
  correct: string[];
}

export class QuizDto {
  @ApiPropertyOptional({ description: 'Id renvoyé par le serveur pour un quiz existant' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Quiz de validation — Histoire et vision' })
  @IsString()
  title: string;

  @ApiProperty({ example: 70, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  passingScore: number;

  @ApiProperty({ type: [QuestionQuizDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionQuizDto)
  questions: QuestionQuizDto[];
}

export class FichierFormationDto {
  @ApiPropertyOptional({ description: 'Id renvoyé par le serveur pour un élément existant' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Introduction' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'URL renvoyée par POST /fichiers' })
  @IsString()
  url: string;
}

export class ChapitreDto {
  @ApiPropertyOptional({ description: 'Id renvoyé par le serveur pour un chapitre existant' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Chapitre 1 — Histoire et vision de la DBC' })
  @IsString()
  title: string;

  @ApiProperty({ example: ['Retracer la genèse du mouvement'] })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({ type: [FichierFormationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FichierFormationDto)
  videos: FichierFormationDto[];

  @ApiProperty({ type: [FichierFormationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FichierFormationDto)
  documents: FichierFormationDto[];

  @ApiProperty({ type: [QuizDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizDto)
  quizzes: QuizDto[];
}

export class SupportPdfDto {
  @ApiProperty({ example: 'Fondamentaux DBC — tous les chapitres' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  url: string;
}

/** Une formation entière (fiche + programme), telle que l'édite "Gestion des formations". */
export class EnregistrerFormationDto {
  @ApiProperty({ example: 'Fondamentaux DBC' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'starter', description: 'Niveau DBC requis (voir GET /adhesion/niveaux)' })
  @IsString()
  levelCode: string;

  @ApiPropertyOptional({ example: 'former', description: 'Pilier (par défaut "former")' })
  @IsOptional()
  @IsString()
  pillarCode?: string;

  @ApiPropertyOptional({ example: 'Aïcha Konaté' })
  @IsOptional()
  @IsString()
  trainer?: string;

  @ApiPropertyOptional({ description: 'Affiche : URL renvoyée par POST /fichiers' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '3 semaines' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'fondamentaux' })
  @IsOptional()
  @IsString()
  domainKey?: string;

  @ApiPropertyOptional({ example: 50, description: 'Coins gagnés en la terminant ; absent = barème "formation terminée"' })
  @IsOptional()
  @IsInt()
  @Min(0)
  coinsReward?: number;

  @ApiProperty({ example: ['Comprendre la mission et les valeurs de la DBC'] })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({ example: ['Expliquer le fonctionnement de la DBC à un nouveau membre'] })
  @IsArray()
  @IsString({ each: true })
  outcomes: string[];

  @ApiPropertyOptional({ type: SupportPdfDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SupportPdfDto)
  coursePdf?: SupportPdfDto | null;

  @ApiPropertyOptional({ type: QuizDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDto)
  prerequisiteQuiz?: QuizDto | null;

  @ApiProperty({ type: [ChapitreDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapitreDto)
  chapters: ChapitreDto[];
}

export class ReponsesQuizDto {
  @ApiProperty({ example: { q1: ['a'], q2: ['a', 'b'] }, description: 'Options cochées, par question' })
  @IsObject()
  answers: Record<string, string[]>;
}
