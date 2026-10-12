import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejoindreTontineDto {
  @ApiPropertyOptional({
    example: false,
    default: false,
    description:
      "true : s'inscrire sur la liste d'attente de la prochaine vague au lieu d'entrer dans la plus récente",
  })
  @IsOptional()
  @IsBoolean()
  waitForNextWave?: boolean;
}
