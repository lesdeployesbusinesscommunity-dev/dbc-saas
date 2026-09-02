import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InscriptionDto {
  @ApiProperty({ example: '+237600000000', description: 'Numéro de téléphone au format international' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numéro de téléphone invalide' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'membre@exemple.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}
