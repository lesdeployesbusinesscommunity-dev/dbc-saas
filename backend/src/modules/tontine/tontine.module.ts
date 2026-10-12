import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TontineController } from './interface/tontine.controller';
import { CreerGroupeTontineUseCase } from './application/creer-groupe-tontine.use-case';
import { RejoindreTontineUseCase } from './application/rejoindre-tontine.use-case';
import { CotiserUseCase } from './application/cotiser.use-case';
import { ConfirmerCotisationUseCase } from './application/confirmer-cotisation.use-case';
import { CloturerToursUseCase } from './application/cloturer-tours.use-case';
import { VerserCagnotteUseCase } from './application/verser-cagnotte.use-case';
import { DesignerResponsableUseCase } from './application/designer-responsable.use-case';
import { DefinirFraisRetraitUseCase } from './application/definir-frais-retrait.use-case';
import { ConsulterMaTontineUseCase } from './application/consulter-ma-tontine.use-case';
import { ConsulterTableauDeBordVagueUseCase } from './application/consulter-tableau-de-bord-vague.use-case';
import { NotifierMembreTontineService } from './application/notifier-membre-tontine.service';
import { ParticipationActiveService } from './application/participation-active.service';
import { AffectationVagueService } from './application/affectation-vague.service';
import { GroupeTontineRepositoryPort } from './domaine/groupe-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from './domaine/participation-tontine.repository.port';
import { CotisationTontineRepositoryPort } from './domaine/cotisation-tontine.repository.port';
import { TourTontineRepositoryPort } from './domaine/tour-tontine.repository.port';
import { InscriptionAttenteTontineRepositoryPort } from './domaine/inscription-attente-tontine.repository.port';
import { FraisRetraitTontineRepositoryPort } from './domaine/frais-retrait-tontine.repository.port';
import { NotificationTontineRepositoryPort } from './domaine/notification-tontine.repository.port';
import { NotificateurTontinePort } from './domaine/notificateur-tontine.port';
import { GroupeTontineOrmEntity } from './infrastructure/groupe-tontine.orm-entity';
import { ParticipationTontineOrmEntity } from './infrastructure/participation-tontine.orm-entity';
import { CotisationTontineOrmEntity } from './infrastructure/cotisation-tontine.orm-entity';
import { TourTontineOrmEntity } from './infrastructure/tour-tontine.orm-entity';
import { InscriptionAttenteTontineOrmEntity } from './infrastructure/inscription-attente-tontine.orm-entity';
import { FraisRetraitTontineOrmEntity } from './infrastructure/frais-retrait-tontine.orm-entity';
import { NotificationTontineOrmEntity } from './infrastructure/notification-tontine.orm-entity';
import { GroupeTontinePostgresRepository } from './infrastructure/groupe-tontine.postgres.repository';
import { ParticipationTontinePostgresRepository } from './infrastructure/participation-tontine.postgres.repository';
import { CotisationTontinePostgresRepository } from './infrastructure/cotisation-tontine.postgres.repository';
import { TourTontinePostgresRepository } from './infrastructure/tour-tontine.postgres.repository';
import { InscriptionAttenteTontinePostgresRepository } from './infrastructure/inscription-attente-tontine.postgres.repository';
import { FraisRetraitTontinePostgresRepository } from './infrastructure/frais-retrait-tontine.postgres.repository';
import { NotificationTontinePostgresRepository } from './infrastructure/notification-tontine.postgres.repository';
import { NotificateurTontineWhatsAppSimule } from './infrastructure/notificateur-tontine-whatsapp.simule';
import { AbonnementPaiementsTontine } from './infrastructure/abonnement-paiements-tontine';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { PaiementsModule } from '../paiements/paiements.module';
import { GamificationModule } from '../gamification/gamification.module';
import { GouvernanceModule } from '../gouvernance/gouvernance.module';

/**
 * Module 4 — Tontine, par vagues de 11 membres maximum d'un même niveau (voir
 * domaine/groupe-tontine.ts pour les règles). Dépend d'Adhésion (niveaux,
 * membres), de Paiements (encaissement des cotisations, et abonnement au
 * callback pour les confirmer automatiquement), de Gamification (coins
 * "tontine sans échec") et de Gouvernance (journal d'audit).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupeTontineOrmEntity,
      ParticipationTontineOrmEntity,
      CotisationTontineOrmEntity,
      TourTontineOrmEntity,
      InscriptionAttenteTontineOrmEntity,
      FraisRetraitTontineOrmEntity,
      NotificationTontineOrmEntity,
    ]),
    AdhesionModule,
    PaiementsModule,
    GamificationModule,
    GouvernanceModule,
  ],
  controllers: [TontineController],
  providers: [
    CreerGroupeTontineUseCase,
    RejoindreTontineUseCase,
    CotiserUseCase,
    ConfirmerCotisationUseCase,
    CloturerToursUseCase,
    VerserCagnotteUseCase,
    DesignerResponsableUseCase,
    DefinirFraisRetraitUseCase,
    ConsulterMaTontineUseCase,
    ConsulterTableauDeBordVagueUseCase,
    NotifierMembreTontineService,
    ParticipationActiveService,
    AffectationVagueService,
    AbonnementPaiementsTontine,
    // Le domaine/application dépend des PORTS (abstraits), jamais des implémentations.
    { provide: GroupeTontineRepositoryPort, useClass: GroupeTontinePostgresRepository },
    { provide: ParticipationTontineRepositoryPort, useClass: ParticipationTontinePostgresRepository },
    { provide: CotisationTontineRepositoryPort, useClass: CotisationTontinePostgresRepository },
    { provide: TourTontineRepositoryPort, useClass: TourTontinePostgresRepository },
    { provide: InscriptionAttenteTontineRepositoryPort, useClass: InscriptionAttenteTontinePostgresRepository },
    { provide: FraisRetraitTontineRepositoryPort, useClass: FraisRetraitTontinePostgresRepository },
    { provide: NotificationTontineRepositoryPort, useClass: NotificationTontinePostgresRepository },
    { provide: NotificateurTontinePort, useClass: NotificateurTontineWhatsAppSimule },
  ],
})
export class TontineModule {}
