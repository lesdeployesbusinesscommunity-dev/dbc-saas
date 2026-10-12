/**
 * Entité de domaine pure. Reflète "Cotisation" du cahier de conception,
 * module 4. Le dépôt du membre = cotisation + frais de retrait, pour que le
 * bénéficiaire reçoive la cagnotte complète une fois les frais Mobile Money
 * déduits. Seul le montant de la cotisation (hors frais) alimente la caisse.
 *
 * La cotisation n° 1 de chaque membre revient à DBC ; les n° 2 à 12 vont dans
 * la caisse de la vague.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';
import { COTISATIONS_PAR_MEMBRE } from './participation-tontine';

export const STATUTS_COTISATION = ['en_attente', 'payee', 'echouee'] as const;
export type StatutCotisation = (typeof STATUTS_COTISATION)[number];

/** Préfixe des clés d'idempotence des paiements de cotisation — voir AbonnementPaiementsTontine. */
export const PREFIXE_CLE_PAIEMENT_COTISATION = 'tontine-cotisation:';

export const DESTINATIONS_COTISATION = ['dbc', 'caisse'] as const;
export type DestinationCotisation = (typeof DESTINATIONS_COTISATION)[number];

export class CotisationTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly participationId: string,
    public readonly groupeId: string,
    public readonly membreId: string,
    public readonly numero: number,
    public readonly montant: number,
    public readonly fraisRetrait: number,
    public readonly cleIdempotencePaiement: string,
    public statut: StatutCotisation,
    public payeeLe: Date | null,
    public enRetard: boolean,
    public readonly creeLe: Date,
  ) {}

  static creer(params: {
    participationId: string;
    groupeId: string;
    membreId: string;
    numero: number;
    montant: number;
    fraisRetrait: number;
    cleIdempotencePaiement: string;
  }): ResultatOperation<CotisationTontine> {
    if (!Number.isInteger(params.numero) || params.numero < 1 || params.numero > COTISATIONS_PAR_MEMBRE) {
      return ResultatOperation.echec(`Le numéro de cotisation doit être compris entre 1 et ${COTISATIONS_PAR_MEMBRE}`);
    }
    if (params.montant <= 0) {
      return ResultatOperation.echec('Le montant de la cotisation doit être strictement positif');
    }
    if (params.fraisRetrait < 0) {
      return ResultatOperation.echec('Les frais de retrait ne peuvent pas être négatifs');
    }
    return ResultatOperation.ok(
      new CotisationTontine(
        undefined,
        params.participationId,
        params.groupeId,
        params.membreId,
        params.numero,
        params.montant,
        params.fraisRetrait,
        params.cleIdempotencePaiement,
        'en_attente',
        null,
        false,
        new Date(),
      ),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    participationId: string;
    groupeId: string;
    membreId: string;
    numero: number;
    montant: number;
    fraisRetrait: number;
    cleIdempotencePaiement: string;
    statut: StatutCotisation;
    payeeLe: Date | null;
    enRetard: boolean;
    creeLe: Date;
  }): CotisationTontine {
    return new CotisationTontine(
      donnees.id,
      donnees.participationId,
      donnees.groupeId,
      donnees.membreId,
      donnees.numero,
      donnees.montant,
      donnees.fraisRetrait,
      donnees.cleIdempotencePaiement,
      donnees.statut,
      donnees.payeeLe,
      donnees.enRetard,
      donnees.creeLe,
    );
  }

  get destination(): DestinationCotisation {
    return this.numero === 1 ? 'dbc' : 'caisse';
  }

  /** Montant total que le membre dépose via Mobile Money. */
  get montantADeposer(): number {
    return this.montant + this.fraisRetrait;
  }

  confirmer(payeeLe: Date, echeance: Date): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seule une cotisation en_attente peut être confirmée');
    }
    this.statut = 'payee';
    this.payeeLe = payeeLe;
    this.enRetard = payeeLe > echeance;
    return ResultatOperation.ok();
  }

  marquerEchouee(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seule une cotisation en_attente peut échouer');
    }
    this.statut = 'echouee';
    return ResultatOperation.ok();
  }
}
