import { Injectable } from '@nestjs/common';
import { CategorieCoins, MouvementCoins } from './coins-membre.service';
import { ParticipationActiveService } from '../../tontine/application/participation-active.service';
import { CotisationTontineRepositoryPort } from '../../tontine/domaine/cotisation-tontine.repository.port';

export type TypeActivite = 'cotisation' | 'parrainage' | 'formation' | 'coins';

export interface Activite {
  id: string;
  type: TypeActivite;
  date: Date;
  /** Personne parrainée ou formation terminée, quand l'activité en cite une. */
  nom: string | null;
}

export interface ActiviteMembre {
  recentes: Activite[];
  /** Coins gagnés ce mois-ci, par famille (une entrée par gain). */
  coinsDuMoisParCategorie: Record<CategorieCoins, number[]>;
  nomsDuMois: { parrainage: string[]; formations: string[] };
  badges: ('formation' | 'cotisation' | 'parrainage')[];
}

const NOMBRE_ACTIVITES_RECENTES = 6;
const PREFIXES_NOM: Partial<Record<CategorieCoins, string>> = {
  parrainage: 'Parrainage de ',
  formations: 'Formation : ',
};

function nomCite(mouvement: MouvementCoins): string | null {
  const prefixe = PREFIXES_NOM[mouvement.categorie];
  return prefixe && mouvement.libelle.startsWith(prefixe) ? mouvement.libelle.slice(prefixe.length) : null;
}

/**
 * Le fil "Activités récentes" et le graphe "ce que vous avez fait ce mois-ci"
 * du tableau de bord membre : cotisations payées et Coins gagnés (parrainage,
 * formation, challenges...), datés pour de vrai.
 */
@Injectable()
export class ActiviteMembreService {
  constructor(
    private readonly participationActive: ParticipationActiveService,
    private readonly cotisations: CotisationTontineRepositoryPort,
  ) {}

  async consulter(membreId: string, historiqueCoins: MouvementCoins[]): Promise<ActiviteMembre> {
    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    const cotisationsPayees: Activite[] = [];
    for (const { participation } of await this.participationActive.lister(membreId)) {
      for (const cotisation of await this.cotisations.listerParParticipation(participation.id!)) {
        if (cotisation.statut === 'payee' && cotisation.payeeLe) {
          cotisationsPayees.push({ id: `cotisation-${cotisation.id}`, type: 'cotisation', date: cotisation.payeeLe, nom: null });
        }
      }
    }

    const gains = historiqueCoins.filter((m) => m.montant > 0);
    const activitesCoins: Activite[] = gains.map((m) => ({
      id: `coins-${m.id}`,
      type: m.categorie === 'parrainage' ? 'parrainage' : m.categorie === 'formations' ? 'formation' : 'coins',
      date: m.date,
      nom: nomCite(m),
    }));

    const gainsDuMois = gains.filter((m) => m.date >= debutDuMois);
    const coinsDuMoisParCategorie: Record<CategorieCoins, number[]> = { tontine: [], parrainage: [], formations: [], challenges: [] };
    gainsDuMois.forEach((m) => coinsDuMoisParCategorie[m.categorie].push(m.montant));
    const nomsDuMois = {
      parrainage: gainsDuMois.filter((m) => m.categorie === 'parrainage').map(nomCite).filter((n): n is string => !!n),
      formations: gainsDuMois.filter((m) => m.categorie === 'formations').map(nomCite).filter((n): n is string => !!n),
    };

    const badges: ActiviteMembre['badges'] = [];
    if (coinsDuMoisParCategorie.formations.length > 0) badges.push('formation');
    if (cotisationsPayees.some((a) => a.date >= debutDuMois)) badges.push('cotisation');
    if (coinsDuMoisParCategorie.parrainage.length > 0) badges.push('parrainage');

    return {
      recentes: [...cotisationsPayees, ...activitesCoins]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, NOMBRE_ACTIVITES_RECENTES),
      coinsDuMoisParCategorie,
      nomsDuMois,
      badges,
    };
  }
}
