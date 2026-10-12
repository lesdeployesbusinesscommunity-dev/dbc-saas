import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Champs absents = inchangés ; chaîne vide = effacer (sauf nom/prénom/téléphone). */
export class MettreAJourProfilDto {
  @ApiPropertyOptional({ example: 'Hubert' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Wakap' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: 'hubert@example.com', description: 'Vide pour retirer l’e-mail' })
  @IsOptional()
  @ValidateIf((dto: MettreAJourProfilDto) => dto.email !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+237600000000', description: 'Numéro WhatsApp — sert aussi à se connecter' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Douala' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Cameroun' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'Entrepreneur' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  profession?: string;

  @ApiPropertyOptional({ description: 'URL renvoyée par POST /fichiers, vide pour retirer la photo' })
  @IsOptional()
  @ValidateIf((dto: MettreAJourProfilDto) => dto.photoUrl !== '')
  @IsUrl({ require_tld: false })
  photoUrl?: string;
}
