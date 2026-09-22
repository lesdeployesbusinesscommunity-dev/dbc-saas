/**
 * Entité de domaine pure. Un message envoyé via le formulaire de contact
 * public (page Contacts du frontend) — ne fait pas partie des 10 modules du
 * cahier de conception, ajouté après coup pour que le site vitrine soit
 * complètement fonctionnel côté visiteur.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class MessageContact {
  private constructor(
    public readonly id: string | undefined,
    public readonly nom: string,
    public readonly email: string,
    public readonly telephone: string | null,
    public readonly sujet: string,
    public readonly message: string,
  ) {}

  static creer(params: {
    nom: string;
    email: string;
    telephone?: string;
    sujet: string;
    message: string;
  }): ResultatOperation<MessageContact> {
    if (!EMAIL_PATTERN.test(params.email)) {
      return ResultatOperation.echec('Adresse email invalide');
    }
    return ResultatOperation.ok(
      new MessageContact(undefined, params.nom, params.email, params.telephone ?? null, params.sujet, params.message),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    nom: string;
    email: string;
    telephone: string | null;
    sujet: string;
    message: string;
  }): MessageContact {
    return new MessageContact(donnees.id, donnees.nom, donnees.email, donnees.telephone, donnees.sujet, donnees.message);
  }
}
