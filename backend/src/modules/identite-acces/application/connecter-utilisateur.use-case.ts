import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { SecretDoubleAuthentificationRepositoryPort } from '../domaine/secret-double-authentification.repository.port';
import { CodeOtpRepositoryPort } from '../domaine/code-otp.repository.port';
import { EnvoyeurOtpPort } from '../domaine/envoyeur-otp.port';
import { CodeOtp, genererCodeOtp } from '../domaine/code-otp';

export interface ConnecterUtilisateurCommande {
  telephone: string;
  motDePasse: string;
}

export interface ConnexionReussie {
  requiertOtp: false;
  accessToken: string;
  utilisateur: Utilisateur;
}

export interface ConnexionRequiertOtp {
  requiertOtp: true;
  defiOtpId: string;
}

export type ResultatConnexion = ConnexionReussie | ConnexionRequiertOtp;

/**
 * Orchestration pure : aucune logique métier ici, elle vit dans les entités
 * (Utilisateur.verifierAccesAutorise, CodeOtp). Le message d'erreur reste
 * volontairement générique pour ne pas révéler si le numéro existe. Si la
 * double authentification est active pour ce compte, le mot de passe seul ne
 * suffit pas — voir VerifierOtpConnexionUseCase pour la seconde étape.
 */
@Injectable()
export class ConnecterUtilisateurUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly jwt: JwtService,
    private readonly secrets2fa: SecretDoubleAuthentificationRepositoryPort,
    private readonly codesOtp: CodeOtpRepositoryPort,
    private readonly envoyeurOtp: EnvoyeurOtpPort,
  ) {}

  async executer(commande: ConnecterUtilisateurCommande): Promise<ResultatConnexion> {
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

    const secret2fa = await this.secrets2fa.trouverParUtilisateurId(utilisateur.id!);
    if (secret2fa?.actif) {
      const codeClair = genererCodeOtp();
      const codeHache = await this.hacheur.hacher(codeClair);
      const defi = await this.codesOtp.sauvegarder(
        CodeOtp.creer({ utilisateurId: utilisateur.id!, codeHache }),
      );
      await this.envoyeurOtp.envoyer(utilisateur.telephone, codeClair);
      return { requiertOtp: true, defiOtpId: defi.id! };
    }

    const accessToken = await this.jwt.signAsync({
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
    });

    return { requiertOtp: false, accessToken, utilisateur };
  }
}
