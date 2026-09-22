import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcheterPackDto {
  @ApiProperty({ example: 'decouverte', description: 'Code du pack (voir GET /reseau-mlm/packs)' })
  @IsString()
  packCode: string;
}
