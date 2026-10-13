/**
 * Entité de domaine pure. L'organisation territoriale de la DBC dans UN pays
 * ("Gestion du réseau" de l'admin) — distincte de l'arbre de PARRAINAGE
 * (Réseau MLM) : c'est la chaîne de responsabilité locale. La racine est le
 * responsable national ; en dessous, des branches au nom libre (région,
 * ville, quartier, antenne diaspora...), à n'importe quelle profondeur.
 * Chaque branche a un responsable (leader) et peut avoir un coordinateur —
 * le binôme du "Réseau des Leaders d'Antennes" de la gouvernance.
 *
 * "titresNiveaux" donne un titre de rôle à chaque profondeur (ex. 0 = "Le
 * Visionnaire", 1 = "Responsable Régional"), commun à tout le pays.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export interface NoeudReseau {
  id: string;
  membreId: string | null;
  coordinateurId: string | null;
  libelle: string | null;
  enfants: NoeudReseau[];
}

export const PROFONDEUR_MAXIMUM = 10;
const LONGUEUR_LIBELLE_MAXIMUM = 120;

export class ReseauTerritorial {
  private constructor(
    public readonly pays: string,
    public racine: NoeudReseau | null,
    public titresNiveaux: Record<string, string>,
  ) {}

  static vide(pays: string): ReseauTerritorial {
    return new ReseauTerritorial(pays, null, {});
  }

  static depuisPersistance(donnees: {
    pays: string;
    racine: NoeudReseau | null;
    titresNiveaux: Record<string, string>;
  }): ReseauTerritorial {
    return new ReseauTerritorial(donnees.pays, donnees.racine, donnees.titresNiveaux);
  }

  /** Tous les membres placés dans l'arbre (responsables et coordinateurs). */
  membresPlaces(): string[] {
    const ids: string[] = [];
    const parcourir = (noeud: NoeudReseau) => {
      if (noeud.membreId) ids.push(noeud.membreId);
      if (noeud.coordinateurId) ids.push(noeud.coordinateurId);
      noeud.enfants.forEach(parcourir);
    };
    if (this.racine) parcourir(this.racine);
    return ids;
  }

  /** Remplace l'arbre et les titres, après vérification de leur cohérence. */
  remplacer(racine: NoeudReseau | null, titresNiveaux: Record<string, string>): ResultatOperation<void> {
    const ids = new Set<string>();
    const verifier = (noeud: NoeudReseau, profondeur: number): string | null => {
      if (profondeur > PROFONDEUR_MAXIMUM) return `L'organisation ne peut pas dépasser ${PROFONDEUR_MAXIMUM} échelons`;
      if (!noeud.id || ids.has(noeud.id)) return 'Chaque branche doit avoir un identifiant unique';
      ids.add(noeud.id);
      if (noeud.libelle && noeud.libelle.length > LONGUEUR_LIBELLE_MAXIMUM) return 'Nom de branche trop long';
      if (profondeur > 0 && !noeud.libelle?.trim()) return 'Chaque branche doit avoir un nom';
      for (const enfant of noeud.enfants) {
        const erreur = verifier(enfant, profondeur + 1);
        if (erreur) return erreur;
      }
      return null;
    };
    const erreur = racine ? verifier(racine, 0) : null;
    if (erreur) {
      return ResultatOperation.echec(erreur);
    }
    this.racine = racine;
    this.titresNiveaux = Object.fromEntries(
      Object.entries(titresNiveaux)
        .filter(([profondeur, titre]) => /^\d+$/.test(profondeur) && typeof titre === 'string' && titre.trim())
        .map(([profondeur, titre]) => [profondeur, titre.trim().slice(0, LONGUEUR_LIBELLE_MAXIMUM)]),
    );
    return ResultatOperation.ok();
  }
}
