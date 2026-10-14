import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspaceMembreController } from './interface/espace-membre.controller';
import { ConsulterEspaceMembreUseCase } from './application/consulter-espace-membre.use-case';
import { AnnuaireMembresService } from './application/annuaire-membres.service';
import { ReseauMembreService } from './application/reseau-membre.service';
import { CoinsMembreService } from './application/coins-membre.service';
import { ActiviteMembreService } from './application/activite-membre.service';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { IdentiteAccesModule } from '../identite-acces/identite-acces.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ReseauMlmModule } from '../reseau-mlm/reseau-mlm.module';
import { TontineModule } from '../tontine/tontine.module';
import { PreferencesMembreService } from './application/preferences-membre.service';
import { PreferencesMembreRepositoryPort } from './domaine/preferences-membre.repository.port';
import { PreferencesMembreOrmEntity } from './infrastructure/preferences-membre.orm-entity';
import { PreferencesMembrePostgresRepository } from './infrastructure/preferences-membre.postgres.repository';

/**
 * Vue de lecture de l'espace membre (pages de l'interface membre) : assemble
 * en un seul appel ce que plusieurs modules métier savent du membre connecté.
 * Aucune règle métier ici, aucune écriture — module "feuille" : aucun autre
 * module n'en dépend.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PreferencesMembreOrmEntity]),
    AdhesionModule,
    IdentiteAccesModule,
    GamificationModule,
    ReseauMlmModule,
    TontineModule,
  ],
  controllers: [EspaceMembreController],
  providers: [
    ConsulterEspaceMembreUseCase,
    AnnuaireMembresService,
    PreferencesMembreService,
    { provide: PreferencesMembreRepositoryPort, useClass: PreferencesMembrePostgresRepository },
    ReseauMembreService,
    CoinsMembreService,
    ActiviteMembreService,
  ],
  // L'annuaire sert aussi à l'espace admin (voir EspaceAdminModule).
  exports: [AnnuaireMembresService, ConsulterEspaceMembreUseCase],
})
export class EspaceMembreModule {}
