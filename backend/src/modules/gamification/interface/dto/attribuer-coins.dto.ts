import { IsInt, IsNotEmpty, IsString, IsUUID, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttribuerCoinsDto {
  @ApiProperty()
  @IsUUID()
  membreId: string;

  @ApiProperty({ example: 50, description: 'Positif pour créditer, négatif pour débiter' })
  @IsInt()
  @NotEquals(0)
  amount: number;

  @ApiProperty({ example: 'Récompense événement DBC Summit — motif obligatoire' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
