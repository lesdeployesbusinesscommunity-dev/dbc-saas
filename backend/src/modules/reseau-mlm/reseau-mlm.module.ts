import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReseauMlmController } from './interface/reseau-mlm.controller';
import { AcheterPackUseCase } from './application/acheter-pack.use-case';
import { ConfirmerAchatPackUseCase } from './application/confirmer-achat-pack.use-case';
import { EnregistrerParrainageUseCase } from './application/enregistrer-parrainage.use-case';
import { PackMlmRepositoryPort } from './domaine/pack-mlm.repository.port';
import { AchatPackMlmRepositoryPort } from './domaine/achat-pack-mlm.repository.port';
import { CommissionMlmRepositoryPort } from './domaine/commission-mlm.repository.port';
import { ParrainageMlmRepositoryPort } from './domaine/parrainage-mlm.repository.port';
import { PackMlmOrmEntity } from './infrastructure/pack-mlm.orm-entity';
import { AchatPackMlmOrmEntity } from './infrastructure/achat-pack-mlm.orm-entity';
import { CommissionMlmOrmEntity } from './infrastructure/commission-mlm.orm-entity';
import { ParrainageMlmOrmEntity } from './infrastructure/parrainage-mlm.orm-entity';
import { PackMlmPostgresRepository } from './infrastructure/pack-mlm.postgres.repository';
import { AchatPackMlmPostgresRepository } from './infrastructure/achat-pack-mlm.postgres.repository';
import { CommissionMlmPostgresRepository } from './infrastructure/commission-mlm.postgres.repository';
import { ParrainageMlmPostgresRepository } from './infrastructure/parrainage-mlm.postgres.repository';
import { ReseauMlmBootstrap } from './infrastructure/reseau-mlm.bootstrap';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { PaiementsModule } from '../paiements/paiements.module';
import { GamificationModule } from '../gamification/gamification.module';
import { GouvernanceModule } from '../gouvernance/gouvernance.module';

/**
 * Module 5 — Réseau MLM. Dépend d'Adhésion (niveaux, membres) et de Paiements
 * (socle partagé) — voir cahier de conception, synthèse des relations
 * inter-modules. EnregistrerParrainageUseCase est exporté pour être appelé
 * par Identité & accès lors de la validation d'une demande d'inscription.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PackMlmOrmEntity, AchatPackMlmOrmEntity, CommissionMlmOrmEntity, ParrainageMlmOrmEntity]),
    AdhesionModule,
    PaiementsModule,
    GamificationModule,
    GouvernanceModule,
  ],
  controllers: [ReseauMlmController],
  providers: [
    AcheterPackUseCase,
    ConfirmerAchatPackUseCase,
    EnregistrerParrainageUseCase,
    ReseauMlmBootstrap,
    { provide: PackMlmRepositoryPort, useClass: PackMlmPostgresRepository },
    { provide: AchatPackMlmRepositoryPort, useClass: AchatPackMlmPostgresRepository },
    { provide: CommissionMlmRepositoryPort, useClass: CommissionMlmPostgresRepository },
    { provide: ParrainageMlmRepositoryPort, useClass: ParrainageMlmPostgresRepository },
  ],
  exports: [EnregistrerParrainageUseCase],
})
export class ReseauMlmModule {}
