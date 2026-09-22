import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TYPES_QUESTION_QUIZ, TypeQuestionQuiz } from '../../domaine/question-quiz';

export class QuestionQuizDto {
  @ApiProperty({ example: 'Quel est le premier pas pour formaliser son business ?' })
  @IsString()
  enonce: string;

  @ApiProperty({ enum: TYPES_QUESTION_QUIZ, example: 'qcm' })
  @IsIn(TYPES_QUESTION_QUIZ)
  type: TypeQuestionQuiz;

  @ApiProperty({ required: false, example: ['Ouvrir un compte bancaire', 'Immatriculer son entreprise', 'Rien faire'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  choix?: string[];

  @ApiProperty({ example: 'Immatriculer son entreprise' })
  @IsString()
  reponseCorrecte: string;
}

export class AjouterQuizDto {
  @ApiProperty({ required: false, example: 70, description: 'Score minimum en % pour valider le module (défaut 70)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  seuilReussite?: number;

  @ApiProperty({ type: [QuestionQuizDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionQuizDto)
  questions: QuestionQuizDto[];
}
