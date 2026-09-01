import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { SanteModule } from './modules/sante/sante.module';
import { IdentiteAccesModule } from './modules/identite-acces/identite-acces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    SanteModule,
    IdentiteAccesModule,
    // Les modules suivants seront rattachés au fur et à mesure de leur implémentation :
    // AdhesionModule, PaiementsModule, TontineModule, ReseauMlmModule,
    // GamificationModule, FormationModule, ProgrammesModule,
    // CommunauteDiasporaModule, GouvernanceModule
  ],
})
export class AppModule {}
