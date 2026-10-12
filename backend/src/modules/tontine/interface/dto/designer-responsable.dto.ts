import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DesignerResponsableDto {
  @ApiPropertyOptional({ example: 'uuid-du-membre', description: 'Absent pour retirer le responsable' })
  @IsOptional()
  @IsUUID()
  memberId?: string;
}
