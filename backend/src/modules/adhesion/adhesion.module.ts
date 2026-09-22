import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhesionController } from './interface/adhesion.controller';
import { ChoisirNiveauAdhesionUseCase } from './application/choisir-niveau-adhesion.use-case';
import { MembreRepositoryPort } from './domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from './domaine/niveau-adhesion.repository.port';
import { MembreOrmEntity } from './infrastructure/membre.orm-entity';
import { HistoriqueNiveauMembreOrmEntity } from './infrastructure/historique-niveau-membre.orm-entity';
import { NiveauAdhesionOrmEntity } from './infrastructure/niveau-adhesion.orm-entity';
import { MembrePostgresRepository } from './infrastructure/membre.postgres.repository';
import { NiveauAdhesionPostgresRepository } from './infrastructure/niveau-adhesion.postgres.repository';
import { AdhesionBootstrap } from './infrastructure/adhesion.bootstrap';

/**
 * Module 2 — Adhésion. Membre.id = Utilisateur.id (module Identité & accès) —
 * voir domaine/membre.ts. Le choix de niveau à l'inscription se fait comme une
 * étape séparée de l'onboarding (cahier des charges §4.1), pas fusionnée dans
 * POST /auth/register.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MembreOrmEntity, HistoriqueNiveauMembreOrmEntity, NiveauAdhesionOrmEntity])],
  controllers: [AdhesionController],
  providers: [
    ChoisirNiveauAdhesionUseCase,
    AdhesionBootstrap,
    { provide: MembreRepositoryPort, useClass: MembrePostgresRepository },
    { provide: NiveauAdhesionRepositoryPort, useClass: NiveauAdhesionPostgresRepository },
  ],
  exports: [ChoisirNiveauAdhesionUseCase, MembreRepositoryPort, NiveauAdhesionRepositoryPort],
})
export class AdhesionModule {}
