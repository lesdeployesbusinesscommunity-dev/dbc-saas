import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandesMembresController } from './interface/demandes-membres.controller';
import { DemandesMembresUseCase } from './application/demandes-membres.use-case';
import { DemandeMembreRepositoryPort } from './domaine/demande-membre.repository.port';
import { LectureNotificationRepositoryPort } from './domaine/lecture-notification.repository.port';
import { DemandeMembreOrmEntity } from './infrastructure/demande-membre.orm-entity';
import { LectureNotificationOrmEntity } from './infrastructure/lecture-notification.orm-entity';
import { DemandeMembrePostgresRepository } from './infrastructure/demande-membre.postgres.repository';
import { LectureNotificationPostgresRepository } from './infrastructure/lecture-notification.postgres.repository';
import { EspaceMembreModule } from '../espace-membre/espace-membre.module';
import { IdentiteAccesModule } from '../identite-acces/identite-acces.module';

/**
 * Demandes des membres à l'administration et décisions (pages
 * "Notifications"). Module "feuille" : il lit le profil du membre dans
 * l'espace membre, aucun module métier ne dépend de lui.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DemandeMembreOrmEntity, LectureNotificationOrmEntity]),
    EspaceMembreModule,
    IdentiteAccesModule,
  ],
  controllers: [DemandesMembresController],
  providers: [
    DemandesMembresUseCase,
    { provide: DemandeMembreRepositoryPort, useClass: DemandeMembrePostgresRepository },
    { provide: LectureNotificationRepositoryPort, useClass: LectureNotificationPostgresRepository },
  ],
})
export class DemandesMembresModule {}
