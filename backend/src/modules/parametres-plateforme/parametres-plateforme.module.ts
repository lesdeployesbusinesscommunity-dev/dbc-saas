import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametresPlateformeController } from './interface/parametres-plateforme.controller';
import { ParametresPlateformeService } from './application/parametres-plateforme.service';
import { ParametresPlateformeRepositoryPort } from './domaine/parametres-plateforme.repository.port';
import { ParametresPlateformeOrmEntity } from './infrastructure/parametres-plateforme.orm-entity';
import { ParametresPlateformePostgresRepository } from './infrastructure/parametres-plateforme.postgres.repository';

/**
 * Réglages de la plateforme (page "Paramètres" de l'administrateur). Ne
 * dépend d'aucun module ; Identité & accès s'en sert pour faire respecter la
 * règle de mot de passe.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ParametresPlateformeOrmEntity])],
  controllers: [ParametresPlateformeController],
  providers: [
    ParametresPlateformeService,
    { provide: ParametresPlateformeRepositoryPort, useClass: ParametresPlateformePostgresRepository },
  ],
  exports: [ParametresPlateformeService],
})
export class ParametresPlateformeModule {}
