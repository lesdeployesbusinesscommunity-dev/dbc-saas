import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnvoyerMessageContactDto {
  @ApiProperty({ example: 'Awa Traoré' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'awa@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+2250700000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Devenir membre' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Bonjour, je souhaite en savoir plus sur...' })
  @IsString()
  message: string;
}
