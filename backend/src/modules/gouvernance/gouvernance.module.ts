import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GouvernanceController } from './interface/gouvernance.controller';
import { EnregistrerAuditUseCase } from './application/enregistrer-audit.use-case';
import { PublierAnnonceUseCase } from './application/publier-annonce.use-case';
import { ConsulterTableauDeBordUseCase } from './application/consulter-tableau-de-bord.use-case';
import { ConsulterPolesUseCase } from './application/consulter-poles.use-case';
import { AssignerSiegeUseCase } from './application/assigner-siege.use-case';
import { CreerPoleUseCase } from './application/creer-pole.use-case';
import { ModifierPoleUseCase } from './application/modifier-pole.use-case';
import { SupprimerPoleUseCase } from './application/supprimer-pole.use-case';
import { ReordonnerPolesUseCase } from './application/reordonner-poles.use-case';
import { JournalAuditRepositoryPort } from './domaine/journal-audit.repository.port';
import { AnnonceRepositoryPort } from './domaine/annonce.repository.port';
import { PoleRepositoryPort } from './domaine/pole.repository.port';
import { SiegeRepositoryPort } from './domaine/siege.repository.port';
import { JournalAuditOrmEntity } from './infrastructure/journal-audit.orm-entity';
import { AnnonceOrmEntity } from './infrastructure/annonce.orm-entity';
import { PoleOrmEntity } from './infrastructure/pole.orm-entity';
import { SiegeOrmEntity } from './infrastructure/siege.orm-entity';
import { JournalAuditPostgresRepository } from './infrastructure/journal-audit.postgres.repository';
import { AnnoncePostgresRepository } from './infrastructure/annonce.postgres.repository';
import { PolePostgresRepository } from './infrastructure/pole.postgres.repository';
import { SiegePostgresRepository } from './infrastructure/siege.postgres.repository';
import { GouvernancePolesBootstrap } from './infrastructure/gouvernance-poles.bootstrap';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { PaiementsModule } from '../paiements/paiements.module';
import { ProgrammesModule } from '../programmes/programmes.module';
import { CommunauteDiasporaModule } from '../communaute-diaspora/communaute-diaspora.module';
import { ReseauTerritorialOrmEntity } from './infrastructure/reseau-territorial.orm-entity';
import { ReseauTerritorialPostgresRepository } from './infrastructure/reseau-territorial.postgres.repository';
import { ReseauTerritorialRepositoryPort } from './domaine/reseau-territorial.repository.port';
import { EnregistrerReseauTerritorialUseCase } from './application/enregistrer-reseau-territorial.use-case';

/**
 * Module 10 — Gouvernance et administration. EnregistrerAuditUseCase est
 * exporté : responsabilité transverse, appelée par les autres modules à
 * chaque mutation sensible (cahier de conception, synthèse des relations
 * inter-modules). ConsulterTableauDeBordUseCase (10.3) importe seulement des
 * modules qui n'importent pas GouvernanceModule (Adhésion, Paiements,
 * Programmes, Communauté & diaspora) : Réseau MLM, Gamification et Formation
 * l'importent déjà (pour l'audit), les importer ici créerait un cycle.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalAuditOrmEntity,
      AnnonceOrmEntity,
      PoleOrmEntity,
      SiegeOrmEntity,
      ReseauTerritorialOrmEntity,
    ]),
    AdhesionModule,
    PaiementsModule,
    ProgrammesModule,
    CommunauteDiasporaModule,
  ],
  controllers: [GouvernanceController],
  providers: [
    EnregistrerAuditUseCase,
    PublierAnnonceUseCase,
    ConsulterTableauDeBordUseCase,
    ConsulterPolesUseCase,
    AssignerSiegeUseCase,
    CreerPoleUseCase,
    ModifierPoleUseCase,
    SupprimerPoleUseCase,
    ReordonnerPolesUseCase,
    GouvernancePolesBootstrap,
    EnregistrerReseauTerritorialUseCase,
    { provide: JournalAuditRepositoryPort, useClass: JournalAuditPostgresRepository },
    { provide: AnnonceRepositoryPort, useClass: AnnoncePostgresRepository },
    { provide: PoleRepositoryPort, useClass: PolePostgresRepository },
    { provide: SiegeRepositoryPort, useClass: SiegePostgresRepository },
    { provide: ReseauTerritorialRepositoryPort, useClass: ReseauTerritorialPostgresRepository },
  ],
  exports: [EnregistrerAuditUseCase],
})
export class GouvernanceModule {}
