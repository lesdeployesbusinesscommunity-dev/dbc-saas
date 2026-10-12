import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangerMotDePasseDto {
  @ApiProperty({ example: 'ancienMotDePasse' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'nouveauMotDePasse8', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
