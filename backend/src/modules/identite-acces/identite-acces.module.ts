import { Module } from '@nestjs/common';
import { AuthController } from './interface/auth.controller';
import { InscrireUtilisateurUseCase } from './application/inscrire-utilisateur.use-case';
import { UtilisateurRepositoryPort } from './domaine/utilisateur.repository.port';
import { UtilisateurEnMemoireRepository } from './infrastructure/utilisateur.en-memoire.repository';

@Module({
  controllers: [AuthController],
  providers: [
    InscrireUtilisateurUseCase,
    // Le domaine/application dépend du PORT (abstrait), jamais de l'implémentation.
    // Remplacer cette ligne suffira à brancher Postgres plus tard.
    { provide: UtilisateurRepositoryPort, useClass: UtilisateurEnMemoireRepository },
  ],
})
export class IdentiteAccesModule {}
