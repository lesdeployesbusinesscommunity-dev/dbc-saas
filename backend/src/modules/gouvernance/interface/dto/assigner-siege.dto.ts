import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignerSiegeDto {
  @ApiPropertyOptional({
    example: 'uuid-du-membre',
    description: 'Absent ou vide pour libérer le siège',
  })
  @IsOptional()
  @IsString()
  memberId?: string;
}
