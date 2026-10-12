/**
 * Entité de domaine pure. Reflète "GroupeTontine" du cahier de conception,
 * module 4 — appelé "vague" par DBC. Fonctionnement réel (expliqué par
 * l'équipe DBC, voir mémoire "Tontine : fonctionnement réel") :
 *  - une vague regroupe des membres d'un même niveau, 11 au maximum ;
 *  - le 1er mois de cotisation de chaque membre revient à DBC, les 11 suivants
 *    alimentent la caisse de la vague ;
 *  - dès que la caisse couvre la cagnotte, le membre le plus ancien de la vague
 *    qui n'a pas encore "bouffé" la reçoit (voir TourTontine) ;
 *  - aucune vague n'est bloquée faute de monde : avec moins de 11 membres, les
 *    bouffes sont simplement plus espacées.
 *
 * Cotisation et cagnotte sont figées à la création, pour qu'un changement du
 * catalogue des niveaux n'altère jamais une vague déjà lancée.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_GROUPE_TONTINE = ['en_cours', 'terminee'] as const;
export type StatutGroupeTontine = (typeof STATUTS_GROUPE_TONTINE)[number];

/** 12 mois de cotisation, dont le 1er pour DBC : il reste 11 bouffes, donc 11 membres. */
export const MEMBRES_MAXIMUM_PAR_VAGUE = 11;

export class GroupeTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly niveauId: number,
    public readonly numero: number,
    public readonly cotisationMensuelle: number,
    public readonly montantCagnotte: number,
    public responsableMembreId: string | null,
    public statut: StatutGroupeTontine,
    public readonly creeLe: Date,
  ) {}

  static creer(params: {
    niveauId: number;
    numero: number;
    cotisationMensuelle: number;
    montantCagnotte: number;
    responsableMembreId?: string | null;
  }): ResultatOperation<GroupeTontine> {
    if (params.cotisationMensuelle <= 0 || params.montantCagnotte <= 0) {
      return ResultatOperation.echec('La cotisation et la cagnotte doivent être strictement positives');
    }
    return ResultatOperation.ok(
      new GroupeTontine(
        undefined,
        params.niveauId,
        params.numero,
        params.cotisationMensuelle,
        params.montantCagnotte,
        params.responsableMembreId ?? null,
        'en_cours',
        new Date(),
      ),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    niveauId: number;
    numero: number;
    cotisationMensuelle: number;
    montantCagnotte: number;
    responsableMembreId: string | null;
    statut: StatutGroupeTontine;
    creeLe: Date;
  }): GroupeTontine {
    return new GroupeTontine(
      donnees.id,
      donnees.niveauId,
      donnees.numero,
      donnees.cotisationMensuelle,
      donnees.montantCagnotte,
      donnees.responsableMembreId,
      donnees.statut,
      donnees.creeLe,
    );
  }

  /** Un nouveau membre peut rejoindre la vague tant qu'elle tourne et n'est pas pleine. */
  peutAccueillir(nombreDeMembres: number): ResultatOperation<void> {
    if (this.statut !== 'en_cours') {
      return ResultatOperation.echec('Cette vague est terminée');
    }
    if (nombreDeMembres >= MEMBRES_MAXIMUM_PAR_VAGUE) {
      return ResultatOperation.echec(`Cette vague est complète (${MEMBRES_MAXIMUM_PAR_VAGUE} membres maximum)`);
    }
    return ResultatOperation.ok();
  }

  designerResponsable(membreId: string | null): ResultatOperation<void> {
    if (this.statut !== 'en_cours') {
      return ResultatOperation.echec('Impossible de changer le responsable d’une vague terminée');
    }
    this.responsableMembreId = membreId;
    return ResultatOperation.ok();
  }

  terminer(): ResultatOperation<void> {
    if (this.statut !== 'en_cours') {
      return ResultatOperation.echec('Cette vague est déjà terminée');
    }
    this.statut = 'terminee';
    return ResultatOperation.ok();
  }
}
