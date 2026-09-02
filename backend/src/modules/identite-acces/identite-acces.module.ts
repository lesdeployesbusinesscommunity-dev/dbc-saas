import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './interface/auth.controller';
import { DemandesInscriptionController } from './interface/demandes-inscription.controller';
import { ConnecterUtilisateurUseCase } from './application/connecter-utilisateur.use-case';
import { VerifierOtpConnexionUseCase } from './application/verifier-otp-connexion.use-case';
import { BasculerDoubleAuthentificationUseCase } from './application/basculer-double-authentification.use-case';
import { CreerDemandeInscriptionUseCase } from './application/creer-demande-inscription.use-case';
import { ValiderDemandeInscriptionUseCase } from './application/valider-demande-inscription.use-case';
import { UtilisateurRepositoryPort } from './domaine/utilisateur.repository.port';
import { DemandeInscriptionRepositoryPort } from './domaine/demande-inscription.repository.port';
import { CodeOtpRepositoryPort } from './domaine/code-otp.repository.port';
import { SecretDoubleAuthentificationRepositoryPort } from './domaine/secret-double-authentification.repository.port';
import { EnvoyeurOtpPort } from './domaine/envoyeur-otp.port';
import { UtilisateurOrmEntity } from './infrastructure/utilisateur.orm-entity';
import { DemandeInscriptionOrmEntity } from './infrastructure/demande-inscription.orm-entity';
import { CodeOtpOrmEntity } from './infrastructure/code-otp.orm-entity';
import { SecretDoubleAuthentificationOrmEntity } from './infrastructure/secret-double-authentification.orm-entity';
import { UtilisateurPostgresRepository } from './infrastructure/utilisateur.postgres.repository';
import { DemandeInscriptionPostgresRepository } from './infrastructure/demande-inscription.postgres.repository';
import { CodeOtpPostgresRepository } from './infrastructure/code-otp.postgres.repository';
import { SecretDoubleAuthentificationPostgresRepository } from './infrastructure/secret-double-authentification.postgres.repository';
import { EnvoyeurOtpWhatsAppSimule } from './infrastructure/envoyeur-otp-whatsapp.simule';
import { HacheurMotDePassePort } from './domaine/hacheur-mot-de-passe.port';
import { HacheurBcrypt } from './infrastructure/hacheur-bcrypt';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { ReseauMlmModule } from '../reseau-mlm/reseau-mlm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilisateurOrmEntity,
      DemandeInscriptionOrmEntity,
      CodeOtpOrmEntity,
      SecretDoubleAuthentificationOrmEntity,
    ]),
    PassportModule,
    AdhesionModule, // ValiderDemandeInscriptionUseCase orchestre Identité + Adhésion + Réseau MLM — voir ce use-case.
    ReseauMlmModule,
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
    VerifierOtpConnexionUseCase,
    BasculerDoubleAuthentificationUseCase,
    CreerDemandeInscriptionUseCase,
    ValiderDemandeInscriptionUseCase,
    JwtStrategy,
    // Le domaine/application dépend des PORTS (abstraits), jamais des implémentations.
    // Remplacer ces lignes suffira à changer de base de données / d'algo de hachage / de
    // canal OTP plus tard.
    { provide: UtilisateurRepositoryPort, useClass: UtilisateurPostgresRepository },
    { provide: DemandeInscriptionRepositoryPort, useClass: DemandeInscriptionPostgresRepository },
    { provide: CodeOtpRepositoryPort, useClass: CodeOtpPostgresRepository },
    { provide: SecretDoubleAuthentificationRepositoryPort, useClass: SecretDoubleAuthentificationPostgresRepository },
    { provide: HacheurMotDePassePort, useClass: HacheurBcrypt },
    { provide: EnvoyeurOtpPort, useClass: EnvoyeurOtpWhatsAppSimule },
  ],
})
export class IdentiteAccesModule {}
