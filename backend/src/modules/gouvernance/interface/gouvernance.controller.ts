import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublierAnnonceUseCase } from '../application/publier-annonce.use-case';
import { ConsulterTableauDeBordUseCase } from '../application/consulter-tableau-de-bord.use-case';
import { ConsulterPolesUseCase } from '../application/consulter-poles.use-case';
import { AssignerSiegeUseCase } from '../application/assigner-siege.use-case';
import { AnnonceRepositoryPort } from '../domaine/annonce.repository.port';
import { JournalAuditRepositoryPort } from '../domaine/journal-audit.repository.port';
import { PublierAnnonceDto } from './dto/publier-annonce.dto';
import { AssignerSiegeDto } from './dto/assigner-siege.dto';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

@ApiTags('gouvernance')
@Controller('gouvernance')
export class GouvernanceController {
  constructor(
    private readonly publierAnnonce: PublierAnnonceUseCase,
    private readonly consulterTableauDeBord: ConsulterTableauDeBordUseCase,
    private readonly consulterPoles: ConsulterPolesUseCase,
    private readonly assignerSiege: AssignerSiegeUseCase,
    private readonly annonces: AnnonceRepositoryPort,
    private readonly journal: JournalAuditRepositoryPort,
  ) {}

  @Get('poles')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Lister les pôles de gouvernance et leurs sièges (Administrateur)' })
  async poles() {
    const poles = await this.consulterPoles.executer();
    return poles.map((pole) => ({
      id: pole.id,
      code: pole.code,
      name: pole.nom,
      description: pole.description,
      seats: pole.sieges.map((siege) => ({
        id: siege.id,
        title: siege.titre,
        order: siege.ordre,
        memberId: siege.membreId,
        membershipNumber: siege.matricule,
      })),
    }));
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
