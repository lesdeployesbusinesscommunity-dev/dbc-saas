import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DefinirFraisRetraitDto {
  @ApiProperty({ example: 150, description: 'Frais de retrait en FCFA, ajoutés à chaque dépôt de cotisation du niveau' })
  @IsNumber()
  @Min(0)
  amount: number;
}
