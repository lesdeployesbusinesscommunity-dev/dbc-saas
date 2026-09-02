import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementsController } from './interface/paiements.controller';
import { InitierPaiementUseCase } from './application/initier-paiement.use-case';
import { RecevoirCallbackPaiementUseCase } from './application/recevoir-callback-paiement.use-case';
import { PaiementRepositoryPort } from './domaine/paiement.repository.port';
import { PaiementOrmEntity } from './infrastructure/paiement.orm-entity';
import { PaiementPostgresRepository } from './infrastructure/paiement.postgres.repository';
import { FournisseurPaiementPort } from './domaine/fournisseur-paiement.port';
import { FournisseurPaiementSimule } from './infrastructure/fournisseur-paiement.simule';

/**
 * Module 3 — Paiements. Socle partagé (shared kernel) consulté par Adhésion,
 * Tontine et Réseau MLM — voir le cahier de conception, synthèse des relations
 * inter-modules. InitierPaiementUseCase est exporté pour être injecté par ces
 * modules une fois implémentés.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PaiementOrmEntity])],
  controllers: [PaiementsController],
  providers: [
    InitierPaiementUseCase,
    RecevoirCallbackPaiementUseCase,
    // Le domaine/application dépend des PORTS (abstraits), jamais des implémentations.
    { provide: PaiementRepositoryPort, useClass: PaiementPostgresRepository },
    { provide: FournisseurPaiementPort, useClass: FournisseurPaiementSimule },
  ],
  exports: [InitierPaiementUseCase],
})
export class PaiementsModule {}
