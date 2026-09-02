import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './interface/auth.controller';
import { InscrireUtilisateurUseCase } from './application/inscrire-utilisateur.use-case';
import { ConnecterUtilisateurUseCase } from './application/connecter-utilisateur.use-case';
import { UtilisateurRepositoryPort } from './domaine/utilisateur.repository.port';
import { UtilisateurOrmEntity } from './infrastructure/utilisateur.orm-entity';
import { UtilisateurPostgresRepository } from './infrastructure/utilisateur.postgres.repository';
import { HacheurMotDePassePort } from './domaine/hacheur-mot-de-passe.port';
import { HacheurBcrypt } from './infrastructure/hacheur-bcrypt';
import { JwtStrategy } from './infrastructure/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UtilisateurOrmEntity]),
    PassportModule,
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
  controllers: [AuthController],
  providers: [
    InscrireUtilisateurUseCase,
    ConnecterUtilisateurUseCase,
    JwtStrategy,
    // Le domaine/application dépend des PORTS (abstraits), jamais des implémentations.
    // Remplacer ces lignes suffira à changer de base de données / d'algo de hachage plus tard.
    { provide: UtilisateurRepositoryPort, useClass: UtilisateurPostgresRepository },
    { provide: HacheurMotDePassePort, useClass: HacheurBcrypt },
  ],
})
export class IdentiteAccesModule {}
