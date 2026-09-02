import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgrammesController } from './interface/programmes.controller';
import { PilierRepositoryPort } from './domaine/pilier.repository.port';
import { ProgrammeRepositoryPort } from './domaine/programme.repository.port';
import { PilierOrmEntity } from './infrastructure/pilier.orm-entity';
import { ProgrammeOrmEntity } from './infrastructure/programme.orm-entity';
import { PilierPostgresRepository } from './infrastructure/pilier.postgres.repository';
import { ProgrammePostgresRepository } from './infrastructure/programme.postgres.repository';
import { ProgrammesBootstrap } from './infrastructure/programmes.bootstrap';

/**
 * Module 8 — Programmes (4 piliers). Essentiellement consultatif (cahier de
 * conception : "aucun diagramme d'activité pertinent") — pas de use-cases
 * dédiés, le controller lit directement les ports, comme GET /adhesion/niveaux.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PilierOrmEntity, ProgrammeOrmEntity])],
  controllers: [ProgrammesController],
  providers: [
    ProgrammesBootstrap,
    { provide: PilierRepositoryPort, useClass: PilierPostgresRepository },
    { provide: ProgrammeRepositoryPort, useClass: ProgrammePostgresRepository },
  ],
})
export class ProgrammesModule {}
