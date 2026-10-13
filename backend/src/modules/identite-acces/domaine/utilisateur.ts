/**
 * Entité de domaine pure — aucune dépendance à NestJS, TypeORM ou tout autre
 * framework. Se teste unitairement sans base de données (voir utilisateur.spec.ts).
 * Reflète la classe "Utilisateur" du cahier de conception, module 1.
 *
 * Rôle : un administrateur est d'abord un membre (il garde son espace
 * membre) ; le rôle "admin" lui ouvre en plus le back-office. Il est porté par
 * le jeton d'accès et revérifié par le garde admin côté serveur.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_UTILISATEUR = ['en_attente', 'actif', 'suspendu', 'supprime'] as const;
export type StatutUtilisateur = (typeof STATUTS_UTILISATEUR)[number];

export const ROLES_UTILISATEUR = ['membre', 'admin'] as const;
export type RoleUtilisateur = (typeof ROLES_UTILISATEUR)[number];

export class Utilisateur {
  private constructor(
    public readonly id: string | undefined,
    public email: string | undefined,
    public telephone: string,
    public motDePasseHache: string,
    public statut: StatutUtilisateur,
    public role: RoleUtilisateur,
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
      new Utilisateur(undefined, params.email, params.telephone, params.motDePasseHache, 'en_attente', 'membre'),
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
      new Utilisateur(undefined, params.email, params.telephone, params.motDePasseHache, 'actif', 'membre'),
    );
  }

  /** Reconstruction depuis la persistance (l'id existe déjà). */
  static depuisPersistance(donnees: {
    id: string;
    email?: string;
    telephone: string;
    motDePasseHache: string;
    statut: StatutUtilisateur;
    role: RoleUtilisateur;
  }): Utilisateur {
    return new Utilisateur(
      donnees.id,
      donnees.email,
      donnees.telephone,
      donnees.motDePasseHache,
      donnees.statut,
      donnees.role,
    );
  }

  get estAdmin(): boolean {
    return this.role === 'admin';
  }

  activerApresVerification(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seul un compte en_attente peut être activé');
    }
    this.statut = 'actif';
    return ResultatOperation.ok();
  }

  /** Un compte suspendu ou supprimé ne peut jamais se connecter, quel que soit le mot de passe. */
  verifierAccesAutorise(): ResultatOperation<void> {
    if (this.statut === 'suspendu') {
      return ResultatOperation.echec('Compte suspendu');
    }
    if (this.statut === 'supprime') {
      return ResultatOperation.echec('Compte supprimé');
    }
    return ResultatOperation.ok();
  }

  /**
   * Suppression par l'administrateur : le compte ne peut plus se connecter et
   * disparaît des listes, mais son historique (cotisations, Coins, parrainage)
   * reste intact pour les autres membres et pour l'audit.
   */
  supprimer(): ResultatOperation<void> {
    if (this.statut === 'supprime') {
      return ResultatOperation.echec('Ce compte est déjà supprimé');
    }
    this.statut = 'supprime';
    return ResultatOperation.ok();
  }

  suspendre(): ResultatOperation<void> {
    if (this.statut === 'suspendu') {
      return ResultatOperation.echec('Ce compte est déjà suspendu');
    }
    if (this.statut === 'supprime') {
      return ResultatOperation.echec('Ce compte est supprimé');
    }
    this.statut = 'suspendu';
    return ResultatOperation.ok();
  }

  reactiver(): ResultatOperation<void> {
    if (this.statut !== 'suspendu') {
      return ResultatOperation.echec('Seul un compte suspendu peut être réactivé');
    }
    this.statut = 'actif';
    return ResultatOperation.ok();
  }

  promouvoirAdmin(): void {
    this.role = 'admin';
  }

  changerMotDePasse(nouveauHache: string): void {
    this.motDePasseHache = nouveauHache;
  }

  changerEmail(email: string | undefined): void {
    this.email = email;
  }

  changerTelephone(telephone: string): ResultatOperation<void> {
    if (!/^\+?[0-9]{8,15}$/.test(telephone)) {
      return ResultatOperation.echec('Numéro de téléphone invalide');
    }
    this.telephone = telephone;
    return ResultatOperation.ok();
  }
}
