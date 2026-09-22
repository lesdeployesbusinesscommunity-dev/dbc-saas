import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifierOtpDto {
  @ApiProperty({ description: "Identifiant du défi OTP renvoyé par /auth/login" })
  @IsString()
  otpChallengeId: string;

  @ApiProperty({ example: '123456', description: 'Code à 6 chiffres reçu par WhatsApp' })
  @IsString()
  @Length(6, 6)
  code: string;
}
