/**
 * Entité de domaine pure. Reflète la classe "Membre" du cahier de conception,
 * module 2 — Adhésion.
 *
 * Membre.id est volontairement égal à Utilisateur.id (module Identité & accès) :
 * même identité réelle projetée dans deux bounded contexts distincts, jamais de
 * référence directe à l'entité Utilisateur elle-même (frontière de module stricte).
 */
export type StatutMembre = 'actif';

export class Membre {
  private constructor(
    public readonly id: string,
    public readonly matricule: string,
    public statut: StatutMembre,
    public niveauActuelId: number,
  ) {}

  static creer(params: { id: string; matricule: string; niveauActuelId: number }): Membre {
    return new Membre(params.id, params.matricule, 'actif', params.niveauActuelId);
  }

  static depuisPersistance(donnees: {
    id: string;
    matricule: string;
    statut: StatutMembre;
    niveauActuelId: number;
  }): Membre {
    return new Membre(donnees.id, donnees.matricule, donnees.statut, donnees.niveauActuelId);
  }
}
