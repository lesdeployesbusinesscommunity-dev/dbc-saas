/**
 * Entité de domaine pure. Appartenance d'un membre à une vague (classe
 * "MembreGroupe" du cahier de conception, module 4).
 *
 * Le rang matérialise l'ancienneté dans la vague (1 = premier entré) : c'est
 * lui qui fixe l'ordre de passage pour bouffer. L'ancienneté compte à partir
 * de l'entrée dans la vague, pas de l'adhésion à DBC.
 *
 * Chaque membre doit 12 cotisations comptées à partir de SA date d'entrée
 * (1 pour DBC + 11 pour la caisse), même s'il rejoint une vague déjà lancée.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';
import { ajouterMois } from './calendrier';
import { MEMBRES_MAXIMUM_PAR_VAGUE } from './groupe-tontine';

export const COTISATIONS_PAR_MEMBRE = 12;

export class ParticipationTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly groupeId: string,
    public readonly membreId: string,
    public readonly rang: number,
    public readonly rejointLe: Date,
    public beneficiaireLe: Date | null,
  ) {}

  static creer(params: { groupeId: string; membreId: string; rang: number; rejointLe?: Date }): ResultatOperation<ParticipationTontine> {
    if (!Number.isInteger(params.rang) || params.rang < 1 || params.rang > MEMBRES_MAXIMUM_PAR_VAGUE) {
      return ResultatOperation.echec(`Le rang doit être compris entre 1 et ${MEMBRES_MAXIMUM_PAR_VAGUE}`);
    }
    return ResultatOperation.ok(
      new ParticipationTontine(undefined, params.groupeId, params.membreId, params.rang, params.rejointLe ?? new Date(), null),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    groupeId: string;
    membreId: string;
    rang: number;
    rejointLe: Date;
    beneficiaireLe: Date | null;
  }): ParticipationTontine {
    return new ParticipationTontine(
      donnees.id,
      donnees.groupeId,
      donnees.membreId,
      donnees.rang,
      donnees.rejointLe,
      donnees.beneficiaireLe,
    );
  }

  get aBouffe(): boolean {
    return this.beneficiaireLe !== null;
  }

  /** Échéance de la cotisation n° `numero` (1 à 12) : un mois d'écart entre chaque. */
  echeance(numero: number): Date {
    return ajouterMois(this.rejointLe, numero - 1);
  }

  /** Nombre de cotisations qui devraient déjà être payées à la date donnée. */
  cotisationsAttendues(maintenant: Date): number {
    let attendues = 0;
    while (attendues < COTISATIONS_PAR_MEMBRE && this.echeance(attendues + 1) <= maintenant) {
      attendues++;
    }
    return attendues;
  }

  marquerBeneficiaire(date: Date): ResultatOperation<void> {
    if (this.aBouffe) {
      return ResultatOperation.echec('Ce membre a déjà reçu la cagnotte dans cette vague');
    }
    this.beneficiaireLe = date;
    return ResultatOperation.ok();
  }
}

/** Le prochain à bouffer est le plus ancien de la vague (plus petit rang) qui n'a pas encore reçu la cagnotte. */
export function prochainBeneficiaire(participations: ParticipationTontine[]): ParticipationTontine | null {
  const enAttente = participations.filter((p) => !p.aBouffe).sort((a, b) => a.rang - b.rang);
  return enAttente[0] ?? null;
}
