import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PilierRepositoryPort } from '../domaine/pilier.repository.port';
import { ProgrammeRepositoryPort } from '../domaine/programme.repository.port';
import { ReglerProgrammesUseCase } from '../application/regler-programmes.use-case';
import { AjouterProgrammeDto, ReglerProgrammeDto, versReponseProgramme } from './dto/programme.dto';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

@ApiTags('programmes')
@Controller('programmes')
export class ProgrammesController {
  constructor(
    private readonly piliers: PilierRepositoryPort,
    private readonly programmes: ProgrammeRepositoryPort,
    private readonly reglerProgrammes: ReglerProgrammesUseCase,
  ) {}

  @Get('piliers')
  @ApiOperation({ summary: 'Lister les 4 piliers DBC avec leurs programmes (et les réglages de l’administrateur)' })
  async listerPiliers() {
    const [piliers, programmes] = await Promise.all([this.piliers.listerTous(), this.programmes.listerTous()]);
    return piliers.map((pilier) => ({
      code: pilier.code,
      name: pilier.nom,
      tagline: pilier.tagline,
      programs: programmes.filter((programme) => programme.pilierCode === pilier.code).map(versReponseProgramme),
    }));
  }

  @Post()
  @UseGuards(AdminSecretGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiOperation({ summary: 'Ajouter un programme dans un pilier (Administrateur)' })
  async ajouter(@Body() dto: AjouterProgrammeDto) {
    const programme = await this.reglerProgrammes.ajouter({
      code: dto.code,
      pilierCode: dto.group,
      nom: dto.name,
      statut: dto.status,
      visible: dto.visible,
      resume: dto.summary,
      explication: dto.overview,
    });
    return versReponseProgramme(programme);
  }

  @Patch(':code')
  @UseGuards(AdminSecretGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiOperation({ summary: 'Régler un programme : statut, visibilité, résumé, explication (Administrateur)' })
  async regler(@Param('code') code: string, @Body() dto: ReglerProgrammeDto) {
    const programme = await this.reglerProgrammes.regler(code, {
      nom: dto.name,
      statut: dto.status,
      visible: dto.visible,
      resume: dto.summary,
      explication: dto.overview,
    });
    return versReponseProgramme(programme);
  }

  @Delete(':code')
  @UseGuards(AdminSecretGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiOperation({ summary: 'Supprimer un programme ajouté par l’administrateur (Administrateur)' })
  async supprimer(@Param('code') code: string) {
    await this.reglerProgrammes.supprimer(code);
    return { deleted: true };
  }
}
