import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './interface/gamification.controller';
import { ReclamerGainCoinsUseCase } from './application/reclamer-gain-coins.use-case';
import { AttribuerCoinsManuellementUseCase } from './application/attribuer-coins-manuellement.use-case';
import { CatalogueActionsCoinsRepositoryPort } from './domaine/catalogue-actions-coins.repository.port';
import { TransactionCoinsRepositoryPort } from './domaine/transaction-coins.repository.port';
import { CatalogueActionsCoinsOrmEntity } from './infrastructure/catalogue-actions-coins.orm-entity';
import { TransactionCoinsOrmEntity } from './infrastructure/transaction-coins.orm-entity';
import { CatalogueActionsCoinsPostgresRepository } from './infrastructure/catalogue-actions-coins.postgres.repository';
import { TransactionCoinsPostgresRepository } from './infrastructure/transaction-coins.postgres.repository';
import { GamificationBootstrap } from './infrastructure/gamification.bootstrap';

/**
 * Module 6 — Gamification (DBC Coins). Ne dépend jamais directement des
 * autres modules — elle se contente d'écouter leurs événements (cahier de
 * conception, synthèse des relations inter-modules) : ReclamerGainCoinsUseCase
 * est exporté pour être appelé par les modules qui déclenchent un gain
 * (Réseau MLM aujourd'hui ; Formation, Tontine, Communauté plus tard).
 */
@Module({
  imports: [TypeOrmModule.forFeature([CatalogueActionsCoinsOrmEntity, TransactionCoinsOrmEntity])],
  controllers: [GamificationController],
  providers: [
    ReclamerGainCoinsUseCase,
    AttribuerCoinsManuellementUseCase,
    GamificationBootstrap,
    { provide: CatalogueActionsCoinsRepositoryPort, useClass: CatalogueActionsCoinsPostgresRepository },
    { provide: TransactionCoinsRepositoryPort, useClass: TransactionCoinsPostgresRepository },
  ],
  exports: [ReclamerGainCoinsUseCase],
})
export class GamificationModule {}
