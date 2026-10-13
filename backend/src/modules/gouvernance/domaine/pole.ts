/**
 * Entité de domaine pure. Un "pôle" est une carte de l'organigramme de la
 * gouvernance DBC (Admin/Gouvernance). Selon son type :
 * - "fondatrice" : la Direction fondatrice, avec son siège (jamais supprimée) ;
 * - "sieges" : un pôle à postes nommés (ex. Comité exécutif), sièges à pourvoir ;
 * - "reseau" : le Réseau des Leaders d'Antennes, lu dans l'organisation
 *   territoriale (voir ReseauTerritorial) — pas de sièges propres ;
 * - "niveau" : un conseil formé de tous les membres d'un niveau (ex. le
 *   Conseil des Légendes, niveau "legende").
 * Tous peuvent être renommés et réordonnés ; seuls les pôles "sieges" sont
 * créés par l'admin (voir CreerPoleUseCase).
 */
export const TYPES_POLE = ['fondatrice', 'sieges', 'reseau', 'niveau'] as const;
export type TypePole = (typeof TYPES_POLE)[number];

export class Pole {
  private constructor(
    public readonly id: number | undefined,
    public readonly code: string,
    public nom: string,
    public description: string,
    public ordre: number,
    public icone: string,
    public readonly type: TypePole,
    public readonly niveauCode: string | null,
  ) {}

  static creer(params: {
    code: string;
    nom: string;
    description: string;
    ordre: number;
    icone: string;
    type?: TypePole;
    niveauCode?: string | null;
  }): Pole {
    return new Pole(
      undefined,
      params.code,
      params.nom,
      params.description,
      params.ordre,
      params.icone,
      params.type ?? 'sieges',
      params.niveauCode ?? null,
    );
  }

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    nom: string;
    description: string;
    ordre: number;
    icone: string;
    type: TypePole;
    niveauCode: string | null;
  }): Pole {
    return new Pole(
      donnees.id,
      donnees.code,
      donnees.nom,
      donnees.description,
      donnees.ordre,
      donnees.icone,
      donnees.type,
      donnees.niveauCode,
    );
  }

  get peutEtreSupprime(): boolean {
    return this.type !== 'fondatrice';
  }

  renommer(params: { nom: string; description: string; icone: string }): void {
    this.nom = params.nom;
    this.description = params.description;
    this.icone = params.icone;
  }

  deplacerA(ordre: number): void {
    this.ordre = ordre;
  }
}
