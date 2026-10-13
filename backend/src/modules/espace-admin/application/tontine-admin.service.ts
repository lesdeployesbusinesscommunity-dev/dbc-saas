import { Injectable } from '@nestjs/common';
import { Annuaire } from '../../espace-membre/application/annuaire-membres.service';
import { GroupeTontineRepositoryPort } from '../../tontine/domaine/groupe-tontine.repository.port';
import { TourTontineRepositoryPort } from '../../tontine/domaine/tour-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from '../../tontine/domaine/participation-tontine.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface BeneficiaireTontine {
  tourId: string;
  niveauCode: string | null;
  membreId: string;
  nom: string;
  ville: string | null;
  montant: number;
  /** "paid" = cagnotte remise ; "pending" = attribuée, à remettre. */
  statut: 'paid' | 'pending';
  date: Date | null;
}

/**
 * Vue tontine du tableau de bord admin : les bénéficiaires du mois (cagnottes
 * attribuées ce mois-ci, et celles encore à remettre) et le nombre de
 * membres engagés dans une vague en cours.
 */
@Injectable()
export class TontineAdminService {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async beneficiairesDuMois(annuaire: Annuaire): Promise<BeneficiaireTontine[]> {
    const [groupes, niveaux] = await Promise.all([this.groupes.lister(), this.niveaux.listerTous()]);
    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    const liste: BeneficiaireTontine[] = [];
    for (const groupe of groupes) {
      for (const tour of await this.tours.listerParGroupe(groupe.id!)) {
        if (!tour.beneficiaireMembreId || tour.statut === 'en_cours') continue;
        const aRemettre = tour.statut === 'a_verser';
        const ceMois = (tour.clotureLe && tour.clotureLe >= debutDuMois) || (tour.verseLe && tour.verseLe >= debutDuMois);
        if (!aRemettre && !ceMois) continue;
        const fiche = annuaire.get(tour.beneficiaireMembreId);
        liste.push({
          tourId: tour.id!,
          niveauCode: niveaux.find((n) => n.id === groupe.niveauId)?.code ?? null,
          membreId: tour.beneficiaireMembreId,
          nom: fiche?.nom ?? 'Membre',
          ville: [fiche?.ville, fiche?.pays].filter(Boolean).join(', ') || null,
          montant: tour.montant,
          statut: tour.statut === 'verse' ? 'paid' : 'pending',
          date: tour.verseLe ?? tour.clotureLe,
        });
      }
    }
    return liste;
  }

  /** Membres distincts présents dans au moins une vague en cours. */
  async membresEnVague(): Promise<number> {
    const membres = new Set<string>();
    for (const groupe of (await this.groupes.lister()).filter((g) => g.statut === 'en_cours')) {
      (await this.participations.listerParGroupe(groupe.id!)).forEach((p) => membres.add(p.membreId));
    }
    return membres.size;
  }
}
