import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Forme simplifiée d'un webhook Mobile Money — à adapter au format réel du fournisseur retenu. */
export class CallbackPaiementDto {
  @ApiProperty({ example: 'cotisation:9f2b...:tour:3' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;
}
