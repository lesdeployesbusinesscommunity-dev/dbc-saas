import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GouvernanceController } from './interface/gouvernance.controller';
import { EnregistrerAuditUseCase } from './application/enregistrer-audit.use-case';
import { PublierAnnonceUseCase } from './application/publier-annonce.use-case';
import { JournalAuditRepositoryPort } from './domaine/journal-audit.repository.port';
import { AnnonceRepositoryPort } from './domaine/annonce.repository.port';
import { JournalAuditOrmEntity } from './infrastructure/journal-audit.orm-entity';
import { AnnonceOrmEntity } from './infrastructure/annonce.orm-entity';
import { JournalAuditPostgresRepository } from './infrastructure/journal-audit.postgres.repository';
import { AnnoncePostgresRepository } from './infrastructure/annonce.postgres.repository';

/**
 * Module 10 — Gouvernance et administration. EnregistrerAuditUseCase est
 * exporté : responsabilité transverse, appelée par les autres modules à
 * chaque mutation sensible (cahier de conception, synthèse des relations
 * inter-modules).
 */
@Module({
  imports: [TypeOrmModule.forFeature([JournalAuditOrmEntity, AnnonceOrmEntity])],
  controllers: [GouvernanceController],
  providers: [
    EnregistrerAuditUseCase,
    PublierAnnonceUseCase,
    { provide: JournalAuditRepositoryPort, useClass: JournalAuditPostgresRepository },
    { provide: AnnonceRepositoryPort, useClass: AnnoncePostgresRepository },
  ],
  exports: [EnregistrerAuditUseCase],
})
export class GouvernanceModule {}
