import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ProfilMembreDto {
  @ApiPropertyOptional({ example: 'Aïcha' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Konaté' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Ambassadrice', description: 'Titre affiché sous le nom' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({ example: 'Formatrice · Coach en gouvernance' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  profession?: string;

  @ApiPropertyOptional({ example: 'Bamako' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Mali' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
}

export class CreerMembreAdminDto extends ProfilMembreDto {
  @ApiProperty({ example: '+22370000000', description: 'Numéro WhatsApp — sert aussi à se connecter' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'aicha@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'MotDePasse2026', description: 'Mot de passe temporaire, à transmettre au membre' })
  @IsString()
  @MinLength(8)
  temporaryPassword: string;

  @ApiProperty({ example: 'elite' })
  @IsString()
  levelCode: string;

  @ApiPropertyOptional({ example: 'DBC-2026-00026', description: 'Matricule du parrain' })
  @IsOptional()
  @IsString()
  sponsorMembershipNumber?: string;
}

export class ModifierMembreAdminDto extends ProfilMembreDto {
  @ApiPropertyOptional({ example: 'aicha@example.com', description: 'Vide pour retirer l’e-mail' })
  @IsOptional()
  @ValidateIf((dto: ModifierMembreAdminDto) => dto.email !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'elite' })
  @IsOptional()
  @IsString()
  levelCode?: string;

  @ApiPropertyOptional({ enum: ['actif', 'desactive'] })
  @IsOptional()
  @IsIn(['actif', 'desactive'])
  status?: 'actif' | 'desactive';

  @ApiPropertyOptional({ example: 840, description: 'Nouveau solde de Coins (l’écart devient un ajustement)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  coins?: number;
}
