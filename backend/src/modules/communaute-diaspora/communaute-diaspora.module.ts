import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunauteController } from './interface/communaute.controller';
import { CreerAntenneUseCase } from './application/creer-antenne.use-case';
import { RejoindreAntenneUseCase } from './application/rejoindre-antenne.use-case';
import { ZoneRepositoryPort } from './domaine/zone.repository.port';
import { AntenneRepositoryPort } from './domaine/antenne.repository.port';
import { MembreAntenneRepositoryPort } from './domaine/membre-antenne.repository.port';
import { ZoneOrmEntity } from './infrastructure/zone.orm-entity';
import { AntenneOrmEntity } from './infrastructure/antenne.orm-entity';
import { MembreAntenneOrmEntity } from './infrastructure/membre-antenne.orm-entity';
import { ZonePostgresRepository } from './infrastructure/zone.postgres.repository';
import { AntennePostgresRepository } from './infrastructure/antenne.postgres.repository';
import { MembreAntennePostgresRepository } from './infrastructure/membre-antenne.postgres.repository';
import { CommunauteBootstrap } from './infrastructure/communaute.bootstrap';

/** Module 9 — Communauté et diaspora. */
@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity, AntenneOrmEntity, MembreAntenneOrmEntity])],
  controllers: [CommunauteController],
  providers: [
    CreerAntenneUseCase,
    RejoindreAntenneUseCase,
    CommunauteBootstrap,
    { provide: ZoneRepositoryPort, useClass: ZonePostgresRepository },
    { provide: AntenneRepositoryPort, useClass: AntennePostgresRepository },
    { provide: MembreAntenneRepositoryPort, useClass: MembreAntennePostgresRepository },
  ],
})
export class CommunauteDiasporaModule {}
