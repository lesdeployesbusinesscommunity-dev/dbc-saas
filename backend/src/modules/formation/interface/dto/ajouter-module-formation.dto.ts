import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AjouterModuleFormationDto {
  @ApiProperty({ example: 'Créer son Business' })
  @IsString()
  titre: string;

  @ApiProperty({ example: 1, description: 'Position du module dans la formation' })
  @IsInt()
  @Min(1)
  ordre: number;
}
