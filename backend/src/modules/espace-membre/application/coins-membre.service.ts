import { Injectable } from '@nestjs/common';
import { Annuaire, FicheMembre } from './annuaire-membres.service';
import { TransactionCoinsRepositoryPort } from '../../gamification/domaine/transaction-coins.repository.port';
import { CatalogueActionsCoinsRepositoryPort } from '../../gamification/domaine/catalogue-actions-coins.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

/** Les 4 familles de gains affichées dans l'espace membre (graphe, historique, barème). */
export type CategorieCoins = 'tontine' | 'parrainage' | 'formations' | 'challenges';

const CATEGORIE_PAR_MOTIF: Record<string, CategorieCoins> = {
  tontine_sans_echec_annuel: 'tontine',
  parrainage_membre_actif_niv3plus: 'parrainage',
  formation_completee: 'formations',
};

/** Libellé de repli pour les transactions enregistrées avant l'ajout des libellés. */
const LIBELLE_PAR_MOTIF: Record<string, string> = {
  formation_completee: 'Formation terminée',
  parrainage_membre_actif_niv3plus: 'Parrainage d’un nouveau membre',
  temoignage_valide: 'Témoignage validé',
  tontine_sans_echec_annuel: 'Tontine : 12 cotisations sans retard',
  entreprise_lancee_post_formation: 'Entreprise lancée après une formation',
  leader_antenne_mensuel: 'Leader d’antenne du mois',
  challenge_mensuel_reussi: 'Challenge mensuel réussi',
  dbc_tour_summit: 'Participation au DBC Tour / Summit',
};

export function categorieDuMotif(motif: string): CategorieCoins {
  return CATEGORIE_PAR_MOTIF[motif] ?? 'challenges';
}

export interface MouvementCoins {
  id: string;
  date: Date;
  montant: number;
  categorie: CategorieCoins;
  motif: string;
  libelle: string;
}

export interface LigneClassementCoins {
  membre: FicheMembre;
  coinsDuMois: number;
}

export interface CoinsMembre {
  solde: number;
  historique: MouvementCoins[];
  classement: LigneClassementCoins[];
  bareme: {
    actions: { code: string; coins: number; categorie: CategorieCoins }[];
    niveaux: { niveauCode: string; coinsParMois: number }[];
  };
}

/**
 * "DBC Coins" : solde et historique du membre, classement de la communauté
 * (depuis le début et ce mois-ci) et barème des gains — tous tirés du
 * registre de Coins et du catalogue d'actions, jamais de chiffres inventés.
 */
@Injectable()
export class CoinsMembreService {
  constructor(
    private readonly transactions: TransactionCoinsRepositoryPort,
    private readonly catalogue: CatalogueActionsCoinsRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async consulter(membreId: string, annuaire: Annuaire): Promise<CoinsMembre> {
    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    const [mesTransactions, gainsDuMois, actions, niveaux] = await Promise.all([
      this.transactions.listerParMembre(membreId),
      this.transactions.gainsDepuis(debutDuMois),
      this.catalogue.listerTous(),
      this.niveaux.listerTous(),
    ]);
    const gainsParMembre = new Map(gainsDuMois.map((ligne) => [ligne.membreId, ligne.solde]));

    return {
      solde: annuaire.get(membreId)?.coins ?? 0,
      historique: mesTransactions.map((t) => ({
        id: t.id!,
        date: t.creeLe ?? new Date(),
        montant: t.delta,
        categorie: categorieDuMotif(t.motif),
        motif: t.motif,
        libelle: t.libelle ?? LIBELLE_PAR_MOTIF[t.motif] ?? t.motif,
      })),
      classement: [...annuaire.values()]
        .filter((fiche) => fiche.statut !== 'suspendu')
        .map((fiche) => ({ membre: fiche, coinsDuMois: gainsParMembre.get(fiche.id) ?? 0 })),
      bareme: {
        actions: actions
          .filter((action) => action.actif)
          .map((action) => ({ code: action.code, coins: action.valeurCoins, categorie: categorieDuMotif(action.code) })),
        niveaux: niveaux.map((niveau) => ({ niveauCode: niveau.code, coinsParMois: niveau.coinsParMois })),
      },
    };
  }
}
