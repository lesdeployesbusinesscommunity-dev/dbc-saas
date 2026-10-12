import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreerGroupeTontineUseCase } from '../application/creer-groupe-tontine.use-case';
import { RejoindreTontineUseCase } from '../application/rejoindre-tontine.use-case';
import { CotiserUseCase } from '../application/cotiser.use-case';
import { ConfirmerCotisationUseCase } from '../application/confirmer-cotisation.use-case';
import { CloturerToursUseCase } from '../application/cloturer-tours.use-case';
import { VerserCagnotteUseCase } from '../application/verser-cagnotte.use-case';
import { DesignerResponsableUseCase } from '../application/designer-responsable.use-case';
import { DefinirFraisRetraitUseCase } from '../application/definir-frais-retrait.use-case';
import { ConsulterMaTontineUseCase } from '../application/consulter-ma-tontine.use-case';
import { ConsulterTableauDeBordVagueUseCase, TableauDeBordVague } from '../application/consulter-tableau-de-bord-vague.use-case';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { TourTontine } from '../domaine/tour-tontine';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { NotificationTontineRepositoryPort } from '../domaine/notification-tontine.repository.port';
import { CreerVagueDto } from './dto/creer-vague.dto';
import { RejoindreTontineDto } from './dto/rejoindre-tontine.dto';
import { DesignerResponsableDto } from './dto/designer-responsable.dto';
import { DefinirFraisRetraitDto } from './dto/definir-frais-retrait.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

function versReponseVague(groupe: GroupeTontine) {
  return {
    id: groupe.id,
    levelId: groupe.niveauId,
    number: groupe.numero,
    monthlyContribution: groupe.cotisationMensuelle,
    payoutAmount: groupe.montantCagnotte,
    responsibleMemberId: groupe.responsableMembreId,
    status: groupe.statut,
    createdAt: groupe.creeLe,
  };
}

function versReponseCotisation(cotisation: CotisationTontine) {
  return {
    id: cotisation.id,
    number: cotisation.numero,
    destination: cotisation.destination,
    amount: cotisation.montant,
    withdrawalFee: cotisation.fraisRetrait,
    amountToDeposit: cotisation.montantADeposer,
    status: cotisation.statut,
    paidAt: cotisation.payeeLe,
    late: cotisation.enRetard,
    idempotencyKey: cotisation.cleIdempotencePaiement,
  };
}

function versReponseTour(tour: TourTontine) {
  return {
    id: tour.id,
    number: tour.numero,
    status: tour.statut,
    beneficiaryMemberId: tour.beneficiaireMembreId,
    amount: tour.montant,
    openedAt: tour.ouvertLe,
    closedAt: tour.clotureLe,
    paidOutAt: tour.verseLe,
  };
}

function versReponseAttente(inscription: InscriptionAttenteTontine) {
  return {
    id: inscription.id,
    memberId: inscription.membreId,
    levelId: inscription.niveauId,
    status: inscription.statut,
    registeredAt: inscription.inscritLe,
  };
}

function versReponseTableauDeBord(tableau: TableauDeBordVague) {
  return {
    wave: versReponseVague(tableau.groupe),
    cashOnHand: tableau.caisse,
    totalPaidToDbc: tableau.totalVerseDbc,
    totalWithdrawalFees: tableau.totalFraisRetrait,
    members: tableau.membres.map((m) => ({
      memberId: m.membreId,
      membershipNumber: m.matricule,
      rank: m.rang,
      joinedAt: m.rejointLe,
      contributionsPaid: m.cotisationsPayees,
      contributionsDue: m.cotisationsAttendues,
      late: m.enRetard,
      paymentPending: m.paiementEnCours,
      receivedPayoutAt: m.beneficiaireLe,
    })),
    rounds: tableau.tours.map(versReponseTour),
  };
}

/**
 * Module 4 — Tontine. Une "vague" (wave) = GroupeTontine du cahier de
 * conception. Les endpoints admin sont protégés par le secret admin temporaire,
 * ceux du membre et du responsable de vague par JWT.
 */
@ApiTags('tontine')
@Controller('tontine')
export class TontineController {
  constructor(
    private readonly creerGroupe: CreerGroupeTontineUseCase,
    private readonly rejoindre: RejoindreTontineUseCase,
    private readonly cotiser: CotiserUseCase,
    private readonly confirmerCotisation: ConfirmerCotisationUseCase,
    private readonly cloturerTours: CloturerToursUseCase,
    private readonly verserCagnotte: VerserCagnotteUseCase,
    private readonly designerResponsable: DesignerResponsableUseCase,
    private readonly definirFraisRetrait: DefinirFraisRetraitUseCase,
    private readonly consulterMaTontine: ConsulterMaTontineUseCase,
    private readonly consulterTableauDeBord: ConsulterTableauDeBordVagueUseCase,
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly frais: FraisRetraitTontineRepositoryPort,
    private readonly notifications: NotificationTontineRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  // ——— Membre ———

  @Post('rejoindre')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Rejoindre la vague la plus récente de mon niveau (ou la liste d'attente) — initie la 1re cotisation",
  })
  async rejoindreTontine(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: RejoindreTontineDto) {
    const resultat = await this.rejoindre.executer({
      membreId: utilisateur.id!,
      telephone: utilisateur.telephone,
      attendreProchaineVague: dto.waitForNextWave ?? false,
    });
    if (resultat.statut === 'liste_attente') {
      return { outcome: 'waiting_list', waitingList: versReponseAttente(resultat.inscription) };
    }
    return {
      outcome: 'joined_wave',
      wave: versReponseVague(resultat.groupe),
      rank: resultat.participation.rang,
      firstContribution: versReponseCotisation(resultat.premiereCotisation),
    };
  }

  @Post('cotisations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payer ma prochaine cotisation (cotisation + frais de retrait) — initie le paiement' })
  async payerCotisation(@UtilisateurCourant() utilisateur: Utilisateur) {
    const { cotisation } = await this.cotiser.executer({ membreId: utilisateur.id!, telephone: utilisateur.telephone });
    return versReponseCotisation(cotisation);
  }

  @Get('ma-tontine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ma vague en cours, mes cotisations, ma place dans la file' })
  async maTontine(@UtilisateurCourant() utilisateur: Utilisateur) {
    const { vague, listeAttente } = await this.consulterMaTontine.executer(utilisateur.id!);
    return {
      waitingList: listeAttente ? versReponseAttente(listeAttente) : null,
      wave: vague
        ? {
            ...versReponseVague(vague.groupe),
            myRank: vague.participation.rang,
            joinedAt: vague.participation.rejointLe,
            receivedPayoutAt: vague.participation.beneficiaireLe,
            membersBeforeMe: vague.membresAvantMoi,
            contributionsPaid: vague.cotisationsPayees,
            contributionsDue: vague.cotisationsAttendues,
            late: vague.enRetard,
            nextDueDate: vague.prochaineEcheance,
            nextDepositAmount: vague.montantProchainDepot,
            cashOnHand: vague.caisse,
            contributions: vague.cotisations.map(versReponseCotisation),
          }
        : null,
    };
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes notifications tontine (cotisations reçues pour un responsable, cagnotte attribuée…)' })
  async mesNotifications(@UtilisateurCourant() utilisateur: Utilisateur) {
    const notifications = await this.notifications.listerParDestinataire(utilisateur.id!);
    return notifications.map((n) => ({
      id: n.id,
      waveId: n.groupeId,
      type: n.type,
      message: n.message,
      read: n.lue,
      createdAt: n.creeLe,
    }));
  }

  @Post('notifications/:id/lue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async marquerNotificationLue(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const notification = await this.notifications.trouverParId(id);
    if (!notification || !notification.marquerLue(utilisateur.id!).succes) {
      throw new NotFoundException('Notification introuvable');
    }
    await this.notifications.sauvegarder(notification);
    return { id: notification.id, read: notification.lue };
  }

  // ——— Responsable de vague ———

  @Get('responsable/vagues')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Les vagues dont je suis responsable' })
  async mesVaguesResponsable(@UtilisateurCourant() utilisateur: Utilisateur) {
    const groupes = await this.groupes.listerParResponsable(utilisateur.id!);
    return groupes.map(versReponseVague);
  }

  @Get('responsable/vagues/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tableau de bord d'une vague dont je suis responsable" })
  async tableauDeBordResponsable(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const tableau = await this.consulterTableauDeBord.executer({ groupeId: id, responsableMembreId: utilisateur.id! });
    return versReponseTableauDeBord(tableau);
  }

  // ——— Administrateur ———

  @Post('vagues')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Ouvrir une nouvelle vague pour un niveau — y affecte la liste d'attente (Administrateur)" })
  async creerVague(@Body() dto: CreerVagueDto) {
    const { groupe, membresAffectes } = await this.creerGroupe.executer({
      codeNiveau: dto.levelCode,
      responsableMembreId: dto.responsibleMemberId ?? null,
    });
    return { ...versReponseVague(groupe), membersFromWaitingList: membresAffectes.map((p) => p.membreId) };
  }

  @Get('vagues')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiQuery({ name: 'levelCode', required: false })
  @ApiOperation({ summary: 'Lister les vagues, les plus récentes d’abord (Administrateur)' })
  async listerVagues(@Query('levelCode') codeNiveau?: string) {
    const niveauId = await this.niveauIdDepuisCode(codeNiveau);
    const groupes = await this.groupes.lister(niveauId);
    return groupes.map(versReponseVague);
  }

  @Get('vagues/:id')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Tableau de bord d'une vague (Administrateur)" })
  async tableauDeBordAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return versReponseTableauDeBord(await this.consulterTableauDeBord.executer({ groupeId: id }));
  }

  @Put('vagues/:id/responsable')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Désigner ou retirer le responsable d'une vague (Administrateur)" })
  async designer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DesignerResponsableDto) {
    const groupe = await this.designerResponsable.executer({ groupeId: id, membreId: dto.memberId ?? null });
    return versReponseVague(groupe);
  }

  @Post('vagues/:id/cloturer-tour')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({
    summary: 'Attribuer la cagnotte au prochain membre si la caisse la couvre (Administrateur) — normalement automatique',
  })
  async cloturerTour(@Param('id', ParseUUIDPipe) id: string) {
    const tours = await this.cloturerTours.executer({ groupeId: id, exigerAuMoinsUnTour: true });
    return tours.map(versReponseTour);
  }

  @Post('tours/:id/verser')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Indiquer que la cagnotte a été remise au bénéficiaire (Administrateur)' })
  async verser(@Param('id', ParseUUIDPipe) id: string) {
    return versReponseTour(await this.verserCagnotte.executer({ tourId: id }));
  }

  @Post('cotisations/:id/confirmer')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({
    summary: 'Rattrapage : confirmer une cotisation dont le paiement est complété (Administrateur) — normalement automatique',
  })
  async confirmer(@Param('id', ParseUUIDPipe) id: string) {
    const { cotisation, toursClotures } = await this.confirmerCotisation.executer({ cotisationId: id });
    return { contribution: versReponseCotisation(cotisation), roundsClosed: toursClotures.map(versReponseTour) };
  }

  @Get('liste-attente')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiQuery({ name: 'levelCode', required: false })
  @ApiOperation({ summary: "Membres en attente d'une prochaine vague, par ordre d'inscription (Administrateur)" })
  async listeAttente(@Query('levelCode') codeNiveau?: string) {
    const niveauId = await this.niveauIdDepuisCode(codeNiveau);
    const inscriptions = await this.attente.listerEnAttente(niveauId);
    return inscriptions.map(versReponseAttente);
  }

  @Get('frais-retrait')
  @ApiOperation({ summary: 'Frais de retrait ajoutés aux cotisations, par niveau' })
  async listerFraisRetrait() {
    const niveaux = await this.niveaux.listerTous();
    const frais = await this.frais.listerTous();
    return niveaux.map((niveau) => ({
      levelCode: niveau.code,
      monthlyContribution: niveau.cotisationMensuelle,
      withdrawalFee: frais.find((f) => f.niveauId === niveau.id)?.montant ?? 0,
    }));
  }

  @Put('frais-retrait/:levelCode')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Fixer les frais de retrait d'un niveau (Administrateur)" })
  async fixerFraisRetrait(@Param('levelCode') codeNiveau: string, @Body() dto: DefinirFraisRetraitDto) {
    const frais = await this.definirFraisRetrait.executer({ codeNiveau, montant: dto.amount });
    return { levelCode: codeNiveau, withdrawalFee: frais.montant };
  }

  private async niveauIdDepuisCode(codeNiveau?: string): Promise<number | undefined> {
    if (!codeNiveau) {
      return undefined;
    }
    const niveau = await this.niveaux.trouverParCode(codeNiveau);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    return niveau.id;
  }
}
