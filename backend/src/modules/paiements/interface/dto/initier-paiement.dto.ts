import { IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitierPaiementDto {
  @ApiProperty({ example: 5000, description: 'Montant en FCFA' })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Cotisation tontine — tour 3' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: '+237600000001' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'cotisation:9f2b...:tour:3',
    description:
      "Clé générée par l'appelant (ex. un autre module métier) pour garantir qu'une même opération ne déclenche jamais deux paiements.",
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
