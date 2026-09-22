import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AjouterLeconDto {
  @ApiProperty({ example: 'Pourquoi créer son business' })
  @IsString()
  titre: string;

  @ApiProperty({ example: 'https://videos.dbc.example/lecons/1.mp4' })
  @IsUrl()
  urlVideo: string;
}
