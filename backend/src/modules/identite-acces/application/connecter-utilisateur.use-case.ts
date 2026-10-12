import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { SecretDoubleAuthentificationRepositoryPort } from '../domaine/secret-double-authentification.repository.port';
import { CodeOtpRepositoryPort } from '../domaine/code-otp.repository.port';
import { EnvoyeurOtpPort } from '../domaine/envoyeur-otp.port';
import { CodeOtp, genererCodeOtp } from '../domaine/code-otp';
import { ProfilUtilisateurService } from './profil-utilisateur.service';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

/** On se connecte avec son numéro de téléphone OU son matricule DBC. */
export interface ConnecterUtilisateurCommande {
  telephone?: string;
  matricule?: string;
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
 * volontairement générique pour ne pas révéler si le numéro ou le matricule
 * existe. Si la double authentification est active pour ce compte, le mot de
 * passe seul ne suffit pas — voir VerifierOtpConnexionUseCase.
 *
 * Les numéros listés dans ADMIN_TELEPHONES sont promus administrateurs à la
 * connexion : c'est ainsi qu'on désigne le(s) premier(s) admin(s), qui sont
 * d'abord des membres inscrits normalement.
 */
@Injectable()
export class ConnecterUtilisateurUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly profil: ProfilUtilisateurService,
    private readonly secrets2fa: SecretDoubleAuthentificationRepositoryPort,
    private readonly codesOtp: CodeOtpRepositoryPort,
    private readonly envoyeurOtp: EnvoyeurOtpPort,
    private readonly config: ConfigService,
  ) {}

  async executer(commande: ConnecterUtilisateurCommande): Promise<ResultatConnexion> {
    const utilisateur = await this.trouverCompte(commande);
    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await this.hacheur.verifier(commande.motDePasse, utilisateur.motDePasseHache);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const acces = utilisateur.verifierAccesAutorise();
    if (!acces.succes) {
      throw new UnauthorizedException(acces.erreur);
    }

    const telephonesAdmin = this.config.get<string[]>('admin.telephones') ?? [];
    if (!utilisateur.estAdmin && telephonesAdmin.includes(utilisateur.telephone)) {
      utilisateur.promouvoirAdmin();
      await this.utilisateurs.sauvegarder(utilisateur);
    }

    const secret2fa = await this.secrets2fa.trouverParUtilisateurId(utilisateur.id!);
    if (secret2fa?.actif) {
      const codeClair = genererCodeOtp();
      const codeHache = await this.hacheur.hacher(codeClair);
      const defi = await this.codesOtp.sauvegarder(CodeOtp.creer({ utilisateurId: utilisateur.id!, codeHache }));
      await this.envoyeurOtp.envoyer(utilisateur.telephone, codeClair);
      return { requiertOtp: true, defiOtpId: defi.id! };
    }

    const accessToken = await this.profil.emettreJeton(utilisateur);
    return { requiertOtp: false, accessToken, utilisateur };
  }

  private async trouverCompte(commande: ConnecterUtilisateurCommande): Promise<Utilisateur | null> {
    if (commande.matricule) {
      const membre = await this.membres.trouverParMatricule(commande.matricule.trim().toUpperCase());
      return membre ? this.utilisateurs.trouverParId(membre.id) : null;
    }
    if (commande.telephone) {
      return this.utilisateurs.trouverParTelephone(commande.telephone);
    }
    return null;
  }
}
