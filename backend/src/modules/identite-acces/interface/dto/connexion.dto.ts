import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnexionDto {
  @ApiProperty({ example: '+237600000000' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  password: string;
}
