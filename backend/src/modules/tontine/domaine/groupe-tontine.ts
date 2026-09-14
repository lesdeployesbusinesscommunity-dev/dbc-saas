/**
 * Entité de domaine pure. Reflète "GroupeTontine" du cahier de conception,
 * module 4. Un groupe est lié à un niveau d'adhésion (Adhésion module,
 * référencé par id uniquement — pas de dépendance directe entre modules).
 *
 * Hypothèse assumée (voir mémoire "Tontine : ambiguïté cycles") : le seuil de
 * 36 membres minimum (cahier des charges §4.3) est vérifié avant de démarrer
 * le premier cycle, pas à la création du groupe — un groupe s'ouvre vide et
 * accueille des membres au fil du temps (cas d'utilisation 4.2).
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_GROUPE_TONTINE = ['ouvert', 'actif', 'clos'] as const;
export type StatutGroupeTontine = (typeof STATUTS_GROUPE_TONTINE)[number];

export const MEMBRES_MINIMUM_PAR_DEFAUT = 36;

export class GroupeTontine {
  private constructor(
    public readonly id: string | undefined,
    public readonly niveauId: number,
    public readonly minMembres: number,
    public statut: StatutGroupeTontine,
  ) {}

  static creer(params: { niveauId: number; minMembres?: number }): GroupeTontine {
    return new GroupeTontine(undefined, params.niveauId, params.minMembres ?? MEMBRES_MINIMUM_PAR_DEFAUT, 'ouvert');
  }

  static depuisPersistance(donnees: {
    id: string;
    niveauId: number;
    minMembres: number;
    statut: StatutGroupeTontine;
  }): GroupeTontine {
    return new GroupeTontine(donnees.id, donnees.niveauId, donnees.minMembres, donnees.statut);
  }

  aUnCycleActif(cycleEnCoursExiste: boolean): boolean {
    return cycleEnCoursExiste;
  }

  /** Le premier cycle ne peut démarrer qu'une fois le quorum de membres atteint. */
  demarrer(nombreDeMembres: number): ResultatOperation<void> {
    if (this.statut !== 'ouvert') {
      return ResultatOperation.echec('Seul un groupe ouvert peut démarrer');
    }
    if (nombreDeMembres < this.minMembres) {
      return ResultatOperation.echec(`Il faut au moins ${this.minMembres} membres pour démarrer (${nombreDeMembres} actuellement)`);
    }
    this.statut = 'actif';
    return ResultatOperation.ok();
  }
}
