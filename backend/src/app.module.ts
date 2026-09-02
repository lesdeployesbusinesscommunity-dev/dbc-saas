import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { SanteModule } from './modules/sante/sante.module';
import { IdentiteAccesModule } from './modules/identite-acces/identite-acces.module';
import { PaiementsModule } from './modules/paiements/paiements.module';
import { AdhesionModule } from './modules/adhesion/adhesion.module';
import { ReseauMlmModule } from './modules/reseau-mlm/reseau-mlm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('baseDeDonnees.url'),
        autoLoadEntities: true, // chaque module enregistre ses entités via forFeature()
        // Pas encore de système de migrations : acceptable tant que le schéma est simple,
        // à remplacer par des migrations TypeORM explicites avant la mise en production.
        synchronize: config.get<string>('environnement') !== 'production',
      }),
    }),
    SanteModule,
    IdentiteAccesModule,
    PaiementsModule,
    AdhesionModule,
    ReseauMlmModule,
    // Les modules suivants seront rattachés au fur et à mesure de leur implémentation :
    // TontineModule (mis en attente, voir memoire),
    // GamificationModule, FormationModule, ProgrammesModule,
    // CommunauteDiasporaModule, GouvernanceModule
  ],
})
export class AppModule {}
