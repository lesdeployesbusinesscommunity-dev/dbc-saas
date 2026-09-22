/**
 * Entité de domaine pure. Reflète "Annonce" du cahier de conception, module 10.
 * auteurId est nullable : les endpoints admin de ce backend passent par un
 * secret partagé (AdminSecretGuard) plutôt qu'une vraie identité admin
 * authentifiée (pas de rôles réels — cas d'utilisation 1.5 pas encore
 * construit), donc l'auteur exact n'est pas toujours connu.
 */
export class Annonce {
  private constructor(
    public readonly id: string | undefined,
    public readonly titre: string,
    public readonly contenu: string,
    public readonly auteurId: string | null,
    public readonly niveauCibleId: number | null,
    public readonly publieeLe: Date,
  ) {}

  static publier(params: {
    titre: string;
    contenu: string;
    auteurId?: string | null;
    niveauCibleId?: number | null;
  }): Annonce {
    return new Annonce(undefined, params.titre, params.contenu, params.auteurId ?? null, params.niveauCibleId ?? null, new Date());
  }

  static depuisPersistance(donnees: {
    id: string;
    titre: string;
    contenu: string;
    auteurId: string | null;
    niveauCibleId: number | null;
    publieeLe: Date;
  }): Annonce {
    return new Annonce(donnees.id, donnees.titre, donnees.contenu, donnees.auteurId, donnees.niveauCibleId, donnees.publieeLe);
  }
}
