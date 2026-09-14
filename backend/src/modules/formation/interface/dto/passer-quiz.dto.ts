import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReponseQuizDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  reponse: string;
}

export class PasserQuizDto {
  @ApiProperty({ type: [ReponseQuizDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReponseQuizDto)
  reponses: ReponseQuizDto[];
}
