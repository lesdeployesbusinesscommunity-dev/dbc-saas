import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignerCoordinateurAntenneDto {
  @ApiPropertyOptional({
    example: 'uuid-du-membre',
    description: 'Absent ou vide pour libérer le poste de coordinateur',
  })
  @IsOptional()
  @IsString()
  memberId?: string;
}
