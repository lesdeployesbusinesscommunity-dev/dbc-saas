import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { CodeOtpRepositoryPort } from '../domaine/code-otp.repository.port';
import { ProfilUtilisateurService } from './profil-utilisateur.service';

export interface VerifierOtpConnexionCommande {
  defiOtpId: string;
  code: string;
}

export interface JetonAcces {
  accessToken: string;
  utilisateur: Utilisateur;
}

/** Seconde étape de la connexion quand la double authentification est active. */
@Injectable()
export class VerifierOtpConnexionUseCase {
  constructor(
    private readonly codesOtp: CodeOtpRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly profil: ProfilUtilisateurService,
  ) {}

  async executer(commande: VerifierOtpConnexionCommande): Promise<JetonAcces> {
    const defi = await this.codesOtp.trouverParId(commande.defiOtpId);
    if (!defi) {
      throw new UnauthorizedException('Défi OTP invalide');
    }

    const codeCorrespond = await this.hacheur.verifier(commande.code, defi.codeHache);
    const resultat = defi.verifierEtConsommer(codeCorrespond);
    await this.codesOtp.sauvegarder(defi);
    if (!resultat.succes) {
      throw new UnauthorizedException(resultat.erreur);
    }

    const utilisateur = await this.utilisateurs.trouverParId(defi.utilisateurId);
    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const acces = utilisateur.verifierAccesAutorise();
    if (!acces.succes) {
      throw new UnauthorizedException(acces.erreur);
    }

    const accessToken = await this.profil.emettreJeton(utilisateur);

    return { accessToken, utilisateur };
  }
}
