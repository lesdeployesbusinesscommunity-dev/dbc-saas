import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';

export interface ConnecterUtilisateurCommande {
  telephone: string;
  motDePasse: string;
}

export interface JetonAcces {
  accessToken: string;
  utilisateur: Utilisateur;
}

/**
 * Orchestration pure : aucune logique métier ici, elle vit dans l'entité
 * (voir Utilisateur.verifierAccesAutorise). Le message d'erreur reste
 * volontairement générique pour ne pas révéler si le numéro existe.
 */
@Injectable()
export class ConnecterUtilisateurUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly jwt: JwtService,
  ) {}

  async executer(commande: ConnecterUtilisateurCommande): Promise<JetonAcces> {
    const utilisateur = await this.utilisateurs.trouverParTelephone(commande.telephone);
    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await this.hacheur.verifier(
      commande.motDePasse,
      utilisateur.motDePasseHache,
    );
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const acces = utilisateur.verifierAccesAutorise();
    if (!acces.succes) {
      throw new UnauthorizedException(acces.erreur);
    }

    const accessToken = await this.jwt.signAsync({
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
    });

    return { accessToken, utilisateur };
  }
}
