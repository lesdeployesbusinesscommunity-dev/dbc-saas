import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValiderDemandeInscriptionDto {
  @ApiProperty({ example: 'motdepasse-temporaire-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  temporaryPassword: string;
}
