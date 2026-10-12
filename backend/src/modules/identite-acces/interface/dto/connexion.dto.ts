import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Connexion par matricule DBC (écran de l'espace membre) ou par numéro de téléphone. */
export class ConnexionDto {
  @ApiPropertyOptional({ example: 'DBC-2026-00017', description: 'Matricule DBC — requis si phoneNumber est absent' })
  @ValidateIf((dto: ConnexionDto) => !dto.phoneNumber)
  @IsString()
  membershipNumber?: string;

  @ApiPropertyOptional({ example: '+237600000000', description: 'Numéro de téléphone — requis si membershipNumber est absent' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  password: string;
}
