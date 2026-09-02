import { Injectable } from '@nestjs/common';
import { SecretDoubleAuthentification } from '../domaine/secret-double-authentification';
import { SecretDoubleAuthentificationRepositoryPort } from '../domaine/secret-double-authentification.repository.port';

/** Cas d'utilisation 1.3 du cahier de conception — "Activer la double authentification". */
@Injectable()
export class BasculerDoubleAuthentificationUseCase {
  constructor(private readonly secrets: SecretDoubleAuthentificationRepositoryPort) {}

  async executer(utilisateurId: string, actif: boolean): Promise<SecretDoubleAuthentification> {
    const existant = await this.secrets.trouverParUtilisateurId(utilisateurId);
    const secret = existant ?? SecretDoubleAuthentification.creerDesactive(utilisateurId);

    if (actif) {
      secret.activer();
    } else {
      secret.desactiver();
    }

    return this.secrets.sauvegarder(secret);
  }
}
