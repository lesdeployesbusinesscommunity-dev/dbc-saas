import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReordonnerPolesDto {
  @ApiProperty({ example: [2, 1, 3], description: 'Ids de tous les pôles, dans le nouvel ordre voulu' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  poleIds: number[];
}
