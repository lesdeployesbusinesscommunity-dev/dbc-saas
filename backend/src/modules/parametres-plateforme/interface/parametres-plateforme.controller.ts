import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';
import { ParametresPlateformeService } from '../application/parametres-plateforme.service';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

/** Tous les réglages ; le détail de chaque bloc est vérifié et borné par normaliserParametres. */
class EnregistrerParametresDto {
  @ApiProperty({ example: { platformName: 'Les Déployés Business Community', defaultLanguage: 'fr' } })
  @IsObject()
  general: Record<string, unknown>;

  @ApiProperty({ example: { cycleDurationMonths: 12, contributionDay: 5, reminderDaysBefore: 3 } })
  @IsObject()
  tontine: Record<string, unknown>;

  @ApiProperty({ example: { passwordMinLength: 8, passwordRequireDigit: true, memberIdleMinutes: 5 } })
  @IsObject()
  security: Record<string, unknown>;

  @ApiPropertyOptional({ example: { autoExportEnabled: true, exportFrequency: 'monthly' } })
  @IsOptional()
  @IsObject()
  backup?: Record<string, unknown>;

  @ApiProperty()
  @IsBoolean()
  notificationsEnabled: boolean;

  @ApiProperty({ example: { cotisationRecue: { membres: true, directeurs: false, leaders: false, admins: true } } })
  @IsObject()
  notificationMatrix: Record<string, unknown>;
}

@ApiTags('parametres-plateforme')
@Controller('parametres-plateforme')
export class ParametresPlateformeController {
  constructor(private readonly parametres: ParametresPlateformeService) {}

  @Get()
  @ApiOperation({ summary: 'Réglages de la plateforme (public : lus par les deux espaces)' })
  async lire() {
    return this.parametres.lire();
  }

  @Put()
  @UseGuards(AdminSecretGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiOperation({ summary: 'Enregistrer les réglages de la plateforme (Administrateur)' })
  async enregistrer(@Body() dto: EnregistrerParametresDto) {
    return this.parametres.enregistrer(dto);
  }
}
