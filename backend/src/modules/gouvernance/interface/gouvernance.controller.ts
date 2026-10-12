import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublierAnnonceUseCase } from '../application/publier-annonce.use-case';
import { ConsulterTableauDeBordUseCase } from '../application/consulter-tableau-de-bord.use-case';
import { ConsulterPolesUseCase, PoleAvecSieges } from '../application/consulter-poles.use-case';
import { AssignerSiegeUseCase } from '../application/assigner-siege.use-case';
import { CreerPoleUseCase } from '../application/creer-pole.use-case';
import { ModifierPoleUseCase } from '../application/modifier-pole.use-case';
import { SupprimerPoleUseCase } from '../application/supprimer-pole.use-case';
import { ReordonnerPolesUseCase } from '../application/reordonner-poles.use-case';
import { AnnonceRepositoryPort } from '../domaine/annonce.repository.port';
import { JournalAuditRepositoryPort } from '../domaine/journal-audit.repository.port';
import { PublierAnnonceDto } from './dto/publier-annonce.dto';
import { AssignerSiegeDto } from './dto/assigner-siege.dto';
import { CreerPoleDto, ModifierPoleDto } from './dto/pole-siege.dto';
import { ReordonnerPolesDto } from './dto/reordonner-poles.dto';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

function versReponsePole(pole: PoleAvecSieges) {
  return {
    id: pole.id,
    code: pole.code,
    name: pole.nom,
    description: pole.description,
    order: pole.ordre,
    icon: pole.icone,
    seats: pole.sieges.map((siege) => ({
      id: siege.id,
      title: siege.titre,
      order: siege.ordre,
      memberId: siege.membreId,
      membershipNumber: siege.matricule,
    })),
  };
}

@ApiTags('gouvernance')
@Controller('gouvernance')
export class GouvernanceController {
  constructor(
    private readonly publierAnnonce: PublierAnnonceUseCase,
    private readonly consulterTableauDeBord: ConsulterTableauDeBordUseCase,
    private readonly consulterPoles: ConsulterPolesUseCase,
    private readonly assignerSiege: AssignerSiegeUseCase,
    private readonly creerPole: CreerPoleUseCase,
    private readonly modifierPole: ModifierPoleUseCase,
    private readonly supprimerPole: SupprimerPoleUseCase,
    private readonly reordonnerPoles: ReordonnerPolesUseCase,
    private readonly annonces: AnnonceRepositoryPort,
    private readonly journal: JournalAuditRepositoryPort,
  ) {}

  @Get('poles')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Lister les pôles de gouvernance et leurs sièges (Administrateur)' })
  async poles() {
    const poles = await this.consulterPoles.executer();
    return poles.map(versReponsePole);
  }

  @Post('poles')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Créer un pôle de gouvernance, avec ses sièges nommés (Administrateur)' })
  async creer(@Body() dto: CreerPoleDto) {
    await this.creerPole.executer({
      nom: dto.name,
      description: dto.description,
      icone: dto.icon,
      titresSieges: dto.seats.map((s) => s.title),
    });
    return this.poles();
  }

  @Patch('poles/reordonner')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Réordonner les pôles de gouvernance (Administrateur)' })
  async reordonner(@Body() dto: ReordonnerPolesDto) {
    await this.reordonnerPoles.executer(dto.poleIds);
    return this.poles();
  }

  @Patch('poles/:id')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Modifier un pôle de gouvernance et ses sièges (Administrateur)' })
  async modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierPoleDto) {
    await this.modifierPole.executer({
      poleId: id,
      nom: dto.name,
      description: dto.description,
      icone: dto.icon,
      sieges: dto.seats.map((s) => ({ id: s.id, titre: s.title })),
    });
    return this.poles();
  }

  @Delete('poles/:id')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Supprimer un pôle de gouvernance (Administrateur)' })
  async supprimer(@Param('id', ParseIntPipe) id: number) {
    await this.supprimerPole.executer(id);
    return this.poles();
  }

  @Post('sieges/:id/assigner')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Assigner ou libérer un siège de gouvernance (Administrateur)' })
  async assigner(@Param('id') id: string, @Body() dto: AssignerSiegeDto) {
    const siege = await this.assignerSiege.executer({ siegeId: id, membreId: dto.memberId ?? null });
    return { id: siege.id, memberId: siege.membreId };
  }

  @Get('tableau-de-bord')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Tableau de bord admin global (Administrateur)' })
  async tableauDeBord() {
    const donnees = await this.consulterTableauDeBord.executer();
    return {
      totalMembers: donnees.totalMembres,
      activeMembers: donnees.membresActifs,
      membersByLevel: donnees.membresParNiveau.map((r) => ({
        levelId: r.niveauId,
        levelName: r.niveauNom,
        count: r.total,
      })),
      totalLevels: donnees.totalNiveaux,
      totalPillars: donnees.totalPiliers,
      totalPrograms: donnees.totalProgrammes,
      totalAntennas: donnees.totalAntennes,
      payments: {
        totalCollectedAllTime: donnees.paiements.totalCollecteHistorique,
        totalCollectedThisMonth: donnees.paiements.totalCollecteCeMois,
        completedPaymentsThisMonth: donnees.paiements.nombrePaiementsCompletesCeMois,
        totalPending: donnees.paiements.totalEnAttente,
        pendingCount: donnees.paiements.nombreEnAttente,
      },
      // null tant que le module Tontine n'est pas implémenté.
      ongoingTontinePots: donnees.cagnottesTontineEnCours,
      totalTontineMembers: donnees.totalMembresTontine,
    };
  }

  @Post('annonces')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Publier une annonce (Directeur / Administrateur)' })
  async publier(@Body() dto: PublierAnnonceDto) {
    const annonce = await this.publierAnnonce.executer({
      titre: dto.title,
      contenu: dto.content,
      niveauCibleId: dto.targetLevelId,
    });
    return { id: annonce.id, title: annonce.titre, publishedAt: annonce.publieeLe };
  }

  @Get('annonces')
  @ApiOperation({ summary: 'Lister les annonces récentes' })
  @ApiQuery({ name: 'limit', required: false })
  async listerAnnonces(@Query('limit') limite?: string) {
    const annonces = await this.annonces.listerRecentes(limite ? parseInt(limite, 10) : 20);
    return annonces.map((a) => ({
      id: a.id,
      title: a.titre,
      content: a.contenu,
      targetLevelId: a.niveauCibleId,
      publishedAt: a.publieeLe,
    }));
  }

  @Get('audit')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Consulter le journal d'audit (Administrateur)" })
  @ApiQuery({ name: 'limit', required: false })
  async consulterAudit(@Query('limit') limite?: string) {
    const entrees = await this.journal.lister(limite ? parseInt(limite, 10) : 50);
    return entrees.map((e) => ({
      action: e.action,
      entityType: e.typeEntite,
      actorId: e.acteurId,
      metadata: e.metadonnees,
    }));
  }
}
