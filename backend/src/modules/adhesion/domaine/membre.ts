/**
 * Entité de domaine pure. Reflète la classe "Membre" du cahier de conception,
 * module 2 — Adhésion.
 *
 * Membre.id est volontairement égal à Utilisateur.id (module Identité & accès) :
 * même identité réelle projetée dans deux bounded contexts distincts, jamais de
 * référence directe à l'entité Utilisateur elle-même (frontière de module stricte).
 *
 * Le profil (nom, ville, profession, photo) est recopié de la demande
 * d'inscription à la validation, puis modifiable par le membre lui-même
 * (Paramètres > Profil de l'espace membre). Le matricule et le niveau, eux,
 * ne le sont jamais par le membre.
 */
export type StatutMembre = 'actif';

export interface ProfilMembre {
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  pays: string | null;
  profession: string | null;
  photoUrl: string | null;
}

export const PROFIL_VIDE: ProfilMembre = {
  prenom: null,
  nom: null,
  ville: null,
  pays: null,
  profession: null,
  photoUrl: null,
};

export class Membre {
  private constructor(
    public readonly id: string,
    public readonly matricule: string,
    public statut: StatutMembre,
    public niveauActuelId: number,
    public profil: ProfilMembre,
    public readonly creeLe: Date | undefined,
  ) {}

  static creer(params: { id: string; matricule: string; niveauActuelId: number; profil?: Partial<ProfilMembre> }): Membre {
    return new Membre(params.id, params.matricule, 'actif', params.niveauActuelId, { ...PROFIL_VIDE, ...params.profil }, undefined);
  }

  static depuisPersistance(donnees: {
    id: string;
    matricule: string;
    statut: StatutMembre;
    niveauActuelId: number;
    profil: ProfilMembre;
    creeLe: Date;
  }): Membre {
    return new Membre(donnees.id, donnees.matricule, donnees.statut, donnees.niveauActuelId, donnees.profil, donnees.creeLe);
  }

  get nomComplet(): string {
    return [this.profil.prenom, this.profil.nom].filter(Boolean).join(' ') || this.matricule;
  }

  /** Seuls les champs fournis changent ; une chaîne vide efface le champ. */
  mettreAJourProfil(modifications: Partial<ProfilMembre>): void {
    const nettoye = Object.fromEntries(
      Object.entries(modifications)
        .filter(([, valeur]) => valeur !== undefined)
        .map(([cle, valeur]) => [cle, typeof valeur === 'string' && valeur.trim() === '' ? null : valeur?.trim() ?? null]),
    );
    this.profil = { ...this.profil, ...nettoye };
  }

  changerNiveau(niveauId: number): void {
    this.niveauActuelId = niveauId;
  }
}
