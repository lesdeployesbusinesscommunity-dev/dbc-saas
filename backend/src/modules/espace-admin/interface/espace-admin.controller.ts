import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TontineAdminService } from '../application/tontine-admin.service';
import { FinancesAdminService } from '../application/finances-admin.service';
import { AnnuaireMembresService } from '../../espace-membre/application/annuaire-membres.service';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

/** Données du tableau de bord admin qui croisent plusieurs modules (tontine, membres). */
@ApiTags('espace-admin')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-secret', required: false })
@UseGuards(AdminSecretGuard)
@Controller('espace-admin')
export class EspaceAdminController {
  constructor(
    private readonly tontine: TontineAdminService,
    private readonly finances: FinancesAdminService,
    private readonly annuaire: AnnuaireMembresService,
  ) {}

  @Get('tontine')
  @ApiOperation({ summary: 'Bénéficiaires de la tontine ce mois-ci et membres engagés dans une vague (admin)' })
  async tontineDuMois() {
    const [beneficiaires, membresEnVague] = await Promise.all([
      this.tontine.beneficiairesDuMois(await this.annuaire.charger()),
      this.tontine.membresEnVague(),
    ]);
    return {
      membersInWaves: membresEnVague,
      beneficiaries: beneficiaires.map((b) => ({
        roundId: b.tourId,
        levelCode: b.niveauCode,
        memberId: b.membreId,
        name: b.nom,
        city: b.ville,
        amount: b.montant,
        status: b.statut,
        at: b.date,
      })),
    };
  }

  @Get('finances')
  @ApiOperation({ summary: 'Gestion financière : chiffres de la tontine par niveau (admin)' })
  async financesParNiveau() {
    const niveaux = await this.finances.parNiveau(await this.annuaire.charger());
    return niveaux.map((n) => ({
      levelCode: n.niveauCode,
      currentPot: n.caisseActuelle,
      totalCollected: n.totalCollecte,
      toursCompleted: n.toursClotures,
      contributionsReceived: n.cotisationsRecues,
      contributionsExpected: n.cotisationsAttendues,
      lateMembers: n.membresEnRetard,
      currentTour: n.moisCycle,
      totalTours: n.dureeCycle,
      memberCount: n.nombreMembres,
    }));
  }
}
