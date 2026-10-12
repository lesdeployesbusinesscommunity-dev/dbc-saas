/**
 * Entité de domaine pure. Reflète "CycleTontine" (un tour) du cahier de
 * conception, module 4. Un tour = une bouffe :
 *   en_cours  → la caisse se remplit, aucun bénéficiaire encore ;
 *   a_verser  → la caisse couvrait la cagnotte : le bénéficiaire est désigné
 *               (le plus ancien qui n'a pas encore bouffé), la cagnotte est
 *               sortie de la caisse et attend d'être versée ;
 *   verse     → la cagnotte a été remise au bénéficiaire.
 *
 * Machine à états stricte (cahier de conception) : un seul tour en_cours à la
 * fois par vague, garanti jusqu'en base par un index unique partiel.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_TOUR_TONTINE = ['en_cours', 'a_verser', 'verse'] as const;
export type StatutTourTontine = (typeof STATUTS_TOUR_TONTINE)[number];

export class TourTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly groupeId: string,
    public readonly numero: number,
    public statut: StatutTourTontine,
    public beneficiaireMembreId: string | null,
    public readonly montant: number,
    public readonly ouvertLe: Date,
    public clotureLe: Date | null,
    public verseLe: Date | null,
  ) {}

  static ouvrir(params: { groupeId: string; numero: number; montant: number }): TourTontine {
    return new TourTontine(undefined, params.groupeId, params.numero, 'en_cours', null, params.montant, new Date(), null, null);
  }

  static depuisPersistance(donnees: {
    id: string;
    groupeId: string;
    numero: number;
    statut: StatutTourTontine;
    beneficiaireMembreId: string | null;
    montant: number;
    ouvertLe: Date;
    clotureLe: Date | null;
    verseLe: Date | null;
  }): TourTontine {
    return new TourTontine(
      donnees.id,
      donnees.groupeId,
      donnees.numero,
      donnees.statut,
      donnees.beneficiaireMembreId,
      donnees.montant,
      donnees.ouvertLe,
      donnees.clotureLe,
      donnees.verseLe,
    );
  }

  /** Clôture le tour au profit du bénéficiaire, à condition que la caisse couvre la cagnotte. */
  cloturer(params: { beneficiaireMembreId: string; caisseDisponible: number; date: Date }): ResultatOperation<void> {
    if (this.statut !== 'en_cours') {
      return ResultatOperation.echec('Seul un tour en_cours peut être clôturé');
    }
    if (params.caisseDisponible < this.montant) {
      return ResultatOperation.echec(
        `Caisse insuffisante : ${params.caisseDisponible} FCFA disponibles pour une cagnotte de ${this.montant} FCFA`,
      );
    }
    this.statut = 'a_verser';
    this.beneficiaireMembreId = params.beneficiaireMembreId;
    this.clotureLe = params.date;
    return ResultatOperation.ok();
  }

  marquerVerse(date: Date): ResultatOperation<void> {
    if (this.statut !== 'a_verser') {
      return ResultatOperation.echec('Seule une cagnotte à verser peut être marquée versée');
    }
    this.statut = 'verse';
    this.verseLe = date;
    return ResultatOperation.ok();
  }
}
