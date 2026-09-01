/**
 * Entité de domaine pure — aucune dépendance à NestJS, TypeORM ou tout autre
 * framework. Se teste unitairement sans base de données (voir utilisateur.spec.ts).
 * Reflète la classe "Utilisateur" du cahier de conception, module 1.
 */
export type StatutUtilisateur = 'en_attente' | 'actif' | 'suspendu';

export class ResultatOperation<T = void> {
  private constructor(
    public readonly succes: boolean,
    public readonly valeur?: T,
    public readonly erreur?: string,
  ) {}
  static ok<T>(valeur?: T) {
    return new ResultatOperation<T>(true, valeur);
  }
  static echec<T>(erreur: string) {
    return new ResultatOperation<T>(false, undefined, erreur);
  }
}

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
}
