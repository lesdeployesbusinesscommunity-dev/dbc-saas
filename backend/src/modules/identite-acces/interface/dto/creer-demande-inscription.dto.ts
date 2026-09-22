import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreerDemandeInscriptionDto {
  @ApiProperty({ example: 'Wakap' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Hubert' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 30, minimum: 18 })
  @IsInt()
  @Min(18)
  age: number;

  @ApiProperty({ example: 'Cameroun' })
  @IsString()
  country: string;

  @ApiProperty({ example: '+237600000000' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'DBC-2026-00001', description: 'Matricule du parrain, si connu' })
  @IsOptional()
  @IsString()
  sponsorCode?: string;

  @ApiProperty({ example: 'starter', description: "Code du niveau souhaité (voir GET /adhesion/niveaux)" })
  @IsString()
  desiredLevelCode: string;
}
