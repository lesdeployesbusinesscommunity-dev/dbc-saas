import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { CodeOtpRepositoryPort } from '../domaine/code-otp.repository.port';

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
    private readonly jwt: JwtService,
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

    const accessToken = await this.jwt.signAsync({
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
    });

    return { accessToken, utilisateur };
  }
}
