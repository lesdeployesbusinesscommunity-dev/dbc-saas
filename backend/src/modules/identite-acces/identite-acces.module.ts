import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './interface/auth.controller';
import { DemandesInscriptionController } from './interface/demandes-inscription.controller';
import { ConnecterUtilisateurUseCase } from './application/connecter-utilisateur.use-case';
import { CreerDemandeInscriptionUseCase } from './application/creer-demande-inscription.use-case';
import { ValiderDemandeInscriptionUseCase } from './application/valider-demande-inscription.use-case';
import { UtilisateurRepositoryPort } from './domaine/utilisateur.repository.port';
import { DemandeInscriptionRepositoryPort } from './domaine/demande-inscription.repository.port';
import { UtilisateurOrmEntity } from './infrastructure/utilisateur.orm-entity';
import { DemandeInscriptionOrmEntity } from './infrastructure/demande-inscription.orm-entity';
import { UtilisateurPostgresRepository } from './infrastructure/utilisateur.postgres.repository';
import { DemandeInscriptionPostgresRepository } from './infrastructure/demande-inscription.postgres.repository';
import { HacheurMotDePassePort } from './domaine/hacheur-mot-de-passe.port';
import { HacheurBcrypt } from './infrastructure/hacheur-bcrypt';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AdhesionModule } from '../adhesion/adhesion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UtilisateurOrmEntity, DemandeInscriptionOrmEntity]),
    PassportModule,
    AdhesionModule, // ValiderDemandeInscriptionUseCase orchestre Identité + Adhésion — voir ce use-case.
    // ConfigModule est global (voir AppModule) : ConfigService est déjà disponible ici.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        // Le typage de @nestjs/jwt attend une chaîne au format "ms" (ex. "15m") ; on le
        // récupère depuis la config applicative, où il est écrit littéralement ainsi.
        signOptions: { expiresIn: config.get<string>('jwt.dureeAcces') as `${number}${'s' | 'm' | 'h' | 'd'}` },
      }),
    }),
  ],
  controllers: [AuthController, DemandesInscriptionController],
  providers: [
    ConnecterUtilisateurUseCase,
    CreerDemandeInscriptionUseCase,
    ValiderDemandeInscriptionUseCase,
    JwtStrategy,
    // Le domaine/application dépend des PORTS (abstraits), jamais des implémentations.
    // Remplacer ces lignes suffira à changer de base de données / d'algo de hachage plus tard.
    { provide: UtilisateurRepositoryPort, useClass: UtilisateurPostgresRepository },
    { provide: DemandeInscriptionRepositoryPort, useClass: DemandeInscriptionPostgresRepository },
    { provide: HacheurMotDePassePort, useClass: HacheurBcrypt },
  ],
})
export class IdentiteAccesModule {}
