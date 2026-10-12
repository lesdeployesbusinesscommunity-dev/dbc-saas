/**
 * Entité de domaine pure. Un "pôle" regroupe un ou plusieurs sièges (voir
 * Siege) — reflète l'organigramme réel de la gouvernance DBC. Deux pôles
 * naissent avec l'application (Founding Leadership, Executive Committee —
 * voir GouvernancePolesBootstrap) ; d'autres peuvent être créés, renommés,
 * réordonnés et supprimés par un admin (voir CreerPoleUseCase et suite) —
 * conforme à la maquette frontend (Admin/Gouvernance : "Ajouter un pôle").
 * "Réseau des Leaders d'Antennes" et "Conseil des Légendes" (les 2 autres
 * cartes de la maquette) ne sont PAS des Pole : ce sont des vues dérivées
 * des antennes réelles (module Communauté & diaspora) et des membres de
 * niveau "legende" — rien à stocker ici pour elles.
 */
export class Pole {
  private constructor(
    public readonly id: number | undefined,
    public readonly code: string,
    public nom: string,
    public description: string,
    public ordre: number,
    public icone: string,
  ) {}

  static creer(params: { code: string; nom: string; description: string; ordre: number; icone: string }): Pole {
    return new Pole(undefined, params.code, params.nom, params.description, params.ordre, params.icone);
  }

  static depuisPersistance(donnees: {
    id: number;
    code: string;
    nom: string;
    description: string;
    ordre: number;
    icone: string;
  }): Pole {
    return new Pole(donnees.id, donnees.code, donnees.nom, donnees.description, donnees.ordre, donnees.icone);
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
