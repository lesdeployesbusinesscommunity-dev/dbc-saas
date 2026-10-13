import { Module } from '@nestjs/common';
import { MembresAdminController } from './interface/membres-admin.controller';
import { EspaceAdminController } from './interface/espace-admin.controller';
import { MembresAdminService } from './application/membres-admin.service';
import { CreerMembreParAdminUseCase } from './application/creer-membre-par-admin.use-case';
import { ModifierMembreParAdminUseCase } from './application/modifier-membre-par-admin.use-case';
import { SupprimerMembreParAdminUseCase } from './application/supprimer-membre-par-admin.use-case';
import { TontineAdminService } from './application/tontine-admin.service';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { IdentiteAccesModule } from '../identite-acces/identite-acces.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ReseauMlmModule } from '../reseau-mlm/reseau-mlm.module';
import { TontineModule } from '../tontine/tontine.module';
import { FormationModule } from '../formation/formation.module';
import { GouvernanceModule } from '../gouvernance/gouvernance.module';
import { EspaceMembreModule } from '../espace-membre/espace-membre.module';

/**
 * Espace administrateur : "Gestion des membres" (fiche complète, ajout, mise à
 * jour, désactivation, suppression) et les vues du tableau de bord qui croisent
 * plusieurs modules. Module "feuille", comme l'espace membre : il orchestre les
 * modules métier, aucun ne dépend de lui.
 */
@Module({
  imports: [
    AdhesionModule,
    IdentiteAccesModule,
    GamificationModule,
    ReseauMlmModule,
    TontineModule,
    FormationModule,
    GouvernanceModule,
    EspaceMembreModule,
  ],
  controllers: [MembresAdminController, EspaceAdminController],
  providers: [
    MembresAdminService,
    CreerMembreParAdminUseCase,
    ModifierMembreParAdminUseCase,
    SupprimerMembreParAdminUseCase,
    TontineAdminService,
  ],
})
export class EspaceAdminModule {}
