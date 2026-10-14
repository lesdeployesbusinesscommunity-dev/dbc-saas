import { Injectable } from '@nestjs/common';
import { Annuaire } from '../../espace-membre/application/annuaire-membres.service';
import { GroupeTontineRepositoryPort } from '../../tontine/domaine/groupe-tontine.repository.port';
import { TourTontineRepositoryPort } from '../../tontine/domaine/tour-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from '../../tontine/domaine/participation-tontine.repository.port';
import { CotisationTontineRepositoryPort } from '../../tontine/domaine/cotisation-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE } from '../../tontine/domaine/participation-tontine';
import { calculerCaisse } from '../../tontine/domaine/caisse';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface FinancesNiveau {
  niveauCode: string;
  /** Argent en caisse dans les vagues en cours (cotisations payées non encore attribuées). */
  caisseActuelle: number;
  /** Cotisations payées depuis le début, toutes vagues du niveau. */
  totalCollecte: number;
  /** Tours clôturés (cagnotte attribuée ou remise). */
  toursClotures: number;
  /** Membres des vagues en cours ayant payé une cotisation ce mois-ci / membres des vagues en cours. */
  cotisationsRecues: number;
  cotisationsAttendues: number;
  /** Noms des membres des vagues en cours qui n'ont pas encore cotisé ce mois-ci. */
  membresEnRetard: string[];
  /** Mois atteint par la plus ancienne vague en cours (0 si aucune), sur un cycle de 12. */
  moisCycle: number;
  dureeCycle: number;
  /** Membres actifs de ce niveau d'adhésion. */
  nombreMembres: number;
}

/** Page "Gestion financière" de l'admin : chiffres de la tontine, niveau par niveau. */
@Injectable()
export class FinancesAdminService {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async parNiveau(annuaire: Annuaire): Promise<FinancesNiveau[]> {
    const [niveaux, groupes] = await Promise.all([this.niveaux.listerTous(), this.groupes.lister()]);
    const maintenant = new Date();
    const debutDuMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const fiches = [...annuaire.values()];

    const resultat: FinancesNiveau[] = [];
    for (const niveau of niveaux) {
      const finances: FinancesNiveau = {
        niveauCode: niveau.code,
        caisseActuelle: 0,
        totalCollecte: 0,
        toursClotures: 0,
        cotisationsRecues: 0,
        cotisationsAttendues: 0,
        membresEnRetard: [],
        moisCycle: 0,
        dureeCycle: COTISATIONS_PAR_MEMBRE,
        nombreMembres: fiches.filter((f) => f.niveauId === niveau.id && f.statut === 'actif').length,
      };

      for (const groupe of groupes.filter((g) => g.niveauId === niveau.id)) {
        const [cotisations, tours] = await Promise.all([
          this.cotisations.listerParGroupe(groupe.id!),
          this.tours.listerParGroupe(groupe.id!),
        ]);
        const payees = cotisations.filter((c) => c.statut === 'payee');
        finances.totalCollecte += payees.reduce((total, c) => total + c.montant, 0);
        finances.toursClotures += tours.filter((t) => t.statut !== 'en_cours').length;
        if (groupe.statut !== 'en_cours') continue;

        finances.caisseActuelle += calculerCaisse(cotisations, tours);
        const membres = await this.participations.listerParGroupe(groupe.id!);
        finances.cotisationsAttendues += membres.length;
        const aCotiseCeMois = (participationId: string | undefined) =>
          payees.some((c) => c.participationId === participationId && c.payeeLe && c.payeeLe >= debutDuMois);
        finances.cotisationsRecues += membres.filter((p) => aCotiseCeMois(p.id)).length;
        finances.membresEnRetard.push(
          ...membres.filter((p) => !aCotiseCeMois(p.id)).map((p) => annuaire.get(p.membreId)?.nom ?? 'Membre'),
        );
        const mois =
          (maintenant.getFullYear() - groupe.creeLe.getFullYear()) * 12 +
          (maintenant.getMonth() - groupe.creeLe.getMonth()) +
          1;
        finances.moisCycle = Math.max(finances.moisCycle, Math.min(mois, COTISATIONS_PAR_MEMBRE));
      }
      resultat.push(finances);
    }
    return resultat;
  }
}
