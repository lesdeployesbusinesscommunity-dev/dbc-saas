import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejoindreTontineDto {
  @ApiPropertyOptional({
    example: 'starter',
    description: "Niveau de la vague visée (le mien ou un niveau inférieur) ; par défaut, mon niveau d'adhésion",
  })
  @IsOptional()
  @IsString()
  levelCode?: string;

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
