import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreerAntenneUseCase } from '../application/creer-antenne.use-case';
import { RejoindreAntenneUseCase } from '../application/rejoindre-antenne.use-case';
import { AssignerCoordinateurAntenneUseCase } from '../application/assigner-coordinateur-antenne.use-case';
import { ZoneRepositoryPort } from '../domaine/zone.repository.port';
import { AntenneRepositoryPort } from '../domaine/antenne.repository.port';
import { CreerAntenneDto } from './dto/creer-antenne.dto';
import { AssignerCoordinateurAntenneDto } from './dto/assigner-coordinateur-antenne.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';
import { Antenne } from '../domaine/antenne';

function versReponseAntenne(antenne: Antenne) {
  return {
    id: antenne.id,
    zoneId: antenne.zoneId,
    city: antenne.ville,
    status: antenne.statut,
    leaderMembreId: antenne.leaderMembreId,
    coordinatorMembreId: antenne.coordinateurMembreId,
  };
}

@ApiTags('communaute-diaspora')
@Controller('communaute')
export class CommunauteController {
  constructor(
    private readonly creerAntenne: CreerAntenneUseCase,
    private readonly rejoindreAntenne: RejoindreAntenneUseCase,
    private readonly assignerCoordinateur: AssignerCoordinateurAntenneUseCase,
    private readonly zones: ZoneRepositoryPort,
    private readonly antennes: AntenneRepositoryPort,
  ) {}

  @Get('zones')
  @ApiOperation({ summary: 'Lister les zones' })
  async listerZones() {
    const zones = await this.zones.listerTous();
    return zones.map((z) => ({ id: z.id, name: z.nom, type: z.type }));
  }

  @Get('antennes')
  @ApiOperation({ summary: 'Lister toutes les antennes' })
  async listerAntennes() {
    const antennes = await this.antennes.listerTous();
    return antennes.map(versReponseAntenne);
  }

  @Post('antennes')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Créer une antenne (admin)' })
  async creer(@Body() dto: CreerAntenneDto) {
    const antenne = await this.creerAntenne.executer({ zoneId: dto.zoneId, ville: dto.city, statut: dto.status });
    return versReponseAntenne(antenne);
  }

  @Post('antennes/:id/rejoindre')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejoindre une antenne' })
  async rejoindre(@Param('id') id: string, @UtilisateurCourant() utilisateur: Utilisateur) {
    const membreAntenne = await this.rejoindreAntenne.executer({ antenneId: id, membreId: utilisateur.id! });
    return { antenneId: membreAntenne.antenneId };
  }

  @Post('antennes/:id/coordinateur')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Assigner ou libérer le coordinateur d'une antenne (admin)" })
  async assignerCoordinateurAntenne(@Param('id') id: string, @Body() dto: AssignerCoordinateurAntenneDto) {
    const antenne = await this.assignerCoordinateur.executer({ antenneId: id, membreId: dto.memberId ?? null });
    return versReponseAntenne(antenne);
  }
}
