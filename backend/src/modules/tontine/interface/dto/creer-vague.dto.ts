import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreerVagueDto {
  @ApiProperty({ example: 'starter', description: 'Code du niveau (voir GET /adhesion/niveaux)' })
  @IsString()
  levelCode: string;

  @ApiPropertyOptional({ example: 'uuid-du-membre', description: 'Responsable de la vague (peut être désigné plus tard)' })
  @IsOptional()
  @IsUUID()
  responsibleMemberId?: string;
}
