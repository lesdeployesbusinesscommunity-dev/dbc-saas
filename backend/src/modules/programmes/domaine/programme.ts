/** "active" : ouvert. "soon" : annoncé, pas encore ouvert. "project" : en projet, à plus long terme. */
export const STATUTS_PROGRAMME = ['active', 'soon', 'project'] as const;
export type StatutProgramme = (typeof STATUTS_PROGRAMME)[number];

/** Les codes des programmes ajoutés par l'administrateur commencent par ce préfixe. */
export const PREFIXE_CODE_PROGRAMME_AJOUTE = 'custom-';

const texteOuNull = (valeur: string | null | undefined): string | null => valeur?.trim() || null;

/**
 * Entité de domaine pure. Reflète "Programme" du cahier de conception,
 * module 8. Le niveau minimum requis n'est pas précisé par programme dans
 * les documents disponibles — laissé absent plutôt qu'inventé.
 *
 * "code" identifie le programme côté interface (ex : "tontine-royale").
 * L'administrateur règle son statut, sa visibilité pour les membres, et peut
 * remplacer son résumé et son explication (null = texte d'origine, traduit
 * côté interface). Il peut aussi ajouter des programmes, qu'il est seul à
 * pouvoir renommer ou supprimer : ceux du catalogue DBC se masquent.
 */
export class Programme {
  private constructor(
    public readonly id: number | undefined,
    public readonly code: string,
    public readonly pilierCode: string,
    public nom: string,
    public readonly niveauMinimumRequisId: number | null,
    public statut: StatutProgramme,
    public visible: boolean,
    public resume: string | null,
    public explication: string | null,
    public readonly ajouteParAdmin: boolean,
  ) {}

  static ajouter(params: {
    code: string;
    pilierCode: string;
    nom: string;
    statut: StatutProgramme;
    visible: boolean;
    resume?: string | null;
    explication?: string | null;
  }): Programme {
    return new Programme(
      undefined,
      params.code,
      params.pilierCode,
      params.nom.trim(),
      null,
      params.statut,
      params.visible,
      texteOuNull(params.resume),
      texteOuNull(params.explication),
      true,
    );
  }

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    pilierCode: string;
    nom: string;
    niveauMinimumRequisId: number | null;
    statut: StatutProgramme;
    visible: boolean;
    resume: string | null;
    explication: string | null;
    ajouteParAdmin: boolean;
  }): Programme {
    return new Programme(
      donnees.id,
      donnees.code,
      donnees.pilierCode,
      donnees.nom,
      donnees.niveauMinimumRequisId,
      donnees.statut,
      donnees.visible,
      donnees.resume,
      donnees.explication,
      donnees.ajouteParAdmin,
    );
  }

  /** Applique les réglages de l'administrateur ; un texte vide rétablit celui d'origine. */
  regler(reglages: {
    nom?: string;
    statut?: StatutProgramme;
    visible?: boolean;
    resume?: string | null;
    explication?: string | null;
  }): void {
    if (reglages.nom !== undefined) {
      if (!this.ajouteParAdmin) {
        throw new Error('Seuls les programmes ajoutés par l’administrateur peuvent être renommés');
      }
      if (!reglages.nom.trim()) {
        throw new Error('Le nom du programme est obligatoire');
      }
      this.nom = reglages.nom.trim();
    }
    if (reglages.statut !== undefined) this.statut = reglages.statut;
    if (reglages.visible !== undefined) this.visible = reglages.visible;
    if (reglages.resume !== undefined) this.resume = texteOuNull(reglages.resume);
    if (reglages.explication !== undefined) this.explication = texteOuNull(reglages.explication);
  }

  get peutEtreSupprime(): boolean {
    return this.ajouteParAdmin;
  }
}
