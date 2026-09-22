/**
 * Entité de domaine pure — aucune dépendance à NestJS, TypeORM ou tout autre
 * framework. Se teste unitairement sans base de données (voir utilisateur.spec.ts).
 * Reflète la classe "Utilisateur" du cahier de conception, module 1.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_UTILISATEUR = ['en_attente', 'actif', 'suspendu'] as const;
export type StatutUtilisateur = (typeof STATUTS_UTILISATEUR)[number];

export class Utilisateur {
  private constructor(
    public readonly id: string | undefined,
    public readonly email: string | undefined,
    public readonly telephone: string,
    public motDePasseHache: string,
    public statut: StatutUtilisateur,
  ) {}

  /** Fabrique — un utilisateur naît toujours "en_attente", jamais "actif" directement. */
  static creer(params: {
    telephone: string;
    email?: string;
    motDePasseHache: string;
  }): ResultatOperation<Utilisateur> {
    if (!/^\+?[0-9]{8,15}$/.test(params.telephone)) {
      return ResultatOperation.echec('Numéro de téléphone invalide');
    }
    return ResultatOperation.ok(
      new Utilisateur(undefined, params.email, params.telephone, params.motDePasseHache, 'en_attente'),
    );
  }

  /**
   * Fabrique utilisée lors de la validation d'une DemandeInscription par un
   * admin : l'identité a déjà été vérifiée manuellement (hors-ligne), donc le
   * compte naît directement "actif" — pas de vérification OTP à faire.
   */
  static creerParAdmin(params: {
    telephone: string;
    email?: string;
    motDePasseHache: string;
  }): ResultatOperation<Utilisateur> {
    if (!/^\+?[0-9]{8,15}$/.test(params.telephone)) {
      return ResultatOperation.echec('Numéro de téléphone invalide');
    }
    return ResultatOperation.ok(
      new Utilisateur(undefined, params.email, params.telephone, params.motDePasseHache, 'actif'),
    );
  }

  /** Reconstruction depuis la persistance (l'id existe déjà). */
  static depuisPersistance(donnees: {
    id: string;
    email?: string;
    telephone: string;
    motDePasseHache: string;
    statut: StatutUtilisateur;
  }): Utilisateur {
    return new Utilisateur(
      donnees.id,
      donnees.email,
      donnees.telephone,
      donnees.motDePasseHache,
      donnees.statut,
    );
  }

  activerApresVerification(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seul un compte en_attente peut être activé');
    }
    this.statut = 'actif';
    return ResultatOperation.ok();
  }

  /** Un compte suspendu ne peut jamais se connecter, quel que soit le mot de passe. */
  verifierAccesAutorise(): ResultatOperation<void> {
    if (this.statut === 'suspendu') {
      return ResultatOperation.echec('Compte suspendu');
    }
    return ResultatOperation.ok();
  }
}
