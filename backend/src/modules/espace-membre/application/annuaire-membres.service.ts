import { Injectable } from '@nestjs/common';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { UtilisateurRepositoryPort } from '../../identite-acces/domaine/utilisateur.repository.port';
import { TransactionCoinsRepositoryPort } from '../../gamification/domaine/transaction-coins.repository.port';

/** Ce que l'espace membre affiche d'une personne (réseau, classement, fiche "CV"). */
export interface FicheMembre {
  id: string;
  nom: string;
  matricule: string;
  niveauId: number;
  niveauCode: string | null;
  profession: string | null;
  ville: string | null;
  pays: string | null;
  photoUrl: string | null;
  coins: number;
  statut: string;
  membreDepuis: Date | null;
  telephone: string | null;
  estAdmin: boolean;
}

export type Annuaire = Map<string, FicheMembre>;

/**
 * Annuaire des membres, chargé une fois par requête : nom et ville (Membre),
 * niveau (Adhésion), numéro WhatsApp et statut (compte), solde de Coins
 * (Gamification). Les autres services de l'espace membre y puisent pour
 * décrire une personne de la même façon partout.
 */
@Injectable()
export class AnnuaireMembresService {
  constructor(
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly transactions: TransactionCoinsRepositoryPort,
  ) {}

  async charger(): Promise<Annuaire> {
    const [membres, niveaux, utilisateurs, soldes] = await Promise.all([
      this.membres.listerTous(),
      this.niveaux.listerTous(),
      this.utilisateurs.listerTous(),
      this.transactions.classement(Number.MAX_SAFE_INTEGER),
    ]);
    const niveauParId = new Map(niveaux.map((n) => [n.id, n]));
    const utilisateurParId = new Map(utilisateurs.map((u) => [u.id!, u]));
    const soldeParId = new Map(soldes.map((s) => [s.membreId, s.solde]));

    return new Map(
      membres.map((membre) => {
        const utilisateur = utilisateurParId.get(membre.id);
        return [
          membre.id,
          {
            id: membre.id,
            nom: membre.nomComplet,
            matricule: membre.matricule,
            niveauId: membre.niveauActuelId,
            niveauCode: niveauParId.get(membre.niveauActuelId)?.code ?? null,
            profession: membre.profil.profession,
            ville: membre.profil.ville,
            pays: membre.profil.pays,
            photoUrl: membre.profil.photoUrl,
            coins: soldeParId.get(membre.id) ?? 0,
            statut: utilisateur?.statut ?? 'actif',
            membreDepuis: membre.creeLe ?? null,
            telephone: utilisateur?.telephone ?? null,
            estAdmin: utilisateur?.estAdmin ?? false,
          },
        ];
      }),
    );
  }
}
