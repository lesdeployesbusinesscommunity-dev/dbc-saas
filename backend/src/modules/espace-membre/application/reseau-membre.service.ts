import { Injectable } from '@nestjs/common';
import { Annuaire, FicheMembre } from './annuaire-membres.service';
import { ParrainageMlm } from '../../reseau-mlm/domaine/parrainage-mlm';
import { ParrainageMlmRepositoryPort } from '../../reseau-mlm/domaine/parrainage-mlm.repository.port';
import { CommissionMlmRepositoryPort } from '../../reseau-mlm/domaine/commission-mlm.repository.port';
import { AchatPackMlmRepositoryPort } from '../../reseau-mlm/domaine/achat-pack-mlm.repository.port';
import { PackMlmRepositoryPort } from '../../reseau-mlm/domaine/pack-mlm.repository.port';
import { ParticipationActiveService } from '../../tontine/application/participation-active.service';
import { CotisationTontineRepositoryPort } from '../../tontine/domaine/cotisation-tontine.repository.port';

export interface NoeudReseau {
  membre: FicheMembre;
  relation: 'direct' | 'indirect';
  /** Distance au membre connecté : 1 = filleul direct. */
  profondeur: number;
  parrainNom: string | null;
  enfants: NoeudReseau[];
}

export interface AlerteReseau {
  membre: FicheMembre;
  type: 'latePayment';
  jours: number;
}

export interface ReseauMembre {
  parrains: { membre: FicheMembre; relation: 'sponsor' | 'sponsorOfSponsor' }[];
  arbre: NoeudReseau[];
  alertes: AlerteReseau[];
  filleulsDirects: number;
  totalReseau: number;
  profondeurMax: number;
}

export interface MlmMembre {
  pack: { nom: string; prix: number; pv: number; niveauRequisCode: string | null } | null;
  volumePersonnel: number;
  commissionsDuMois: number;
  commissionsTotales: number;
  /** Commissions gagnées sur les achats de chaque filleul. */
  commissionParFilleul: Map<string, number>;
}

const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * "Mon Réseau" et "Mon MLM" : la position du membre dans l'arbre de
 * parrainage (ses parrains au-dessus, ses filleuls en dessous), les retards
 * de cotisation de ses filleuls à suivre, et ses commissions Longrich.
 */
@Injectable()
export class ReseauMembreService {
  constructor(
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly commissions: CommissionMlmRepositoryPort,
    private readonly achats: AchatPackMlmRepositoryPort,
    private readonly packs: PackMlmRepositoryPort,
    private readonly participationActive: ParticipationActiveService,
    private readonly cotisations: CotisationTontineRepositoryPort,
  ) {}

  async reseau(membreId: string, annuaire: Annuaire): Promise<ReseauMembre> {
    const [ancetres, tous] = await Promise.all([this.parrainages.listerAncetres(membreId), this.parrainages.listerTous()]);
    const soi = tous.find((p) => p.membreId === membreId);

    // Ancêtres du plus proche au plus lointain → affichés du plus haut au plus proche.
    const parrains = ancetres
      .map((ancetre, index) => ({ fiche: annuaire.get(ancetre.membreId), index }))
      .filter((entree): entree is { fiche: FicheMembre; index: number } => entree.fiche !== undefined)
      .map(({ fiche, index }) => ({
        membre: fiche,
        relation: index === 0 ? ('sponsor' as const) : ('sponsorOfSponsor' as const),
      }))
      .reverse();

    const arbre = soi ? this.construireArbre(soi, tous, annuaire) : [];
    const aPlat = (noeuds: NoeudReseau[]): NoeudReseau[] => noeuds.flatMap((n) => [n, ...aPlat(n.enfants)]);
    const noeuds = aPlat(arbre);

    const alertes: AlerteReseau[] = [];
    for (const noeud of noeuds) {
      const jours = await this.joursDeRetard(noeud.membre.id);
      if (jours !== null) {
        alertes.push({ membre: noeud.membre, type: 'latePayment', jours });
      }
    }

    return {
      parrains,
      arbre,
      alertes,
      filleulsDirects: arbre.length,
      totalReseau: noeuds.length,
      profondeurMax: noeuds.reduce((max, n) => Math.max(max, n.profondeur), 0),
    };
  }

  async mlm(membreId: string): Promise<MlmMembre> {
    const [mesAchats, tousPacks, mesCommissions] = await Promise.all([
      this.achats.listerParMembreId(membreId),
      this.packs.listerTous(),
      this.commissions.listerParBeneficiaire(membreId),
    ]);
    const confirmes = mesAchats.filter((a) => a.statut === 'confirme').sort((a, b) => b.acheteLe.getTime() - a.acheteLe.getTime());
    const packParId = new Map(tousPacks.map((p) => [p.id, p]));
    const dernierPack = confirmes.length ? packParId.get(confirmes[0].packId) : undefined;

    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    let commissionsDuMois = 0;
    let commissionsTotales = 0;
    const commissionParFilleul = new Map<string, number>();
    for (const commission of mesCommissions) {
      const achat = await this.achats.trouverParId(commission.achatId);
      commissionsTotales += commission.montant;
      if (achat && achat.acheteLe >= debutDuMois) {
        commissionsDuMois += commission.montant;
      }
      if (achat) {
        commissionParFilleul.set(achat.membreId, (commissionParFilleul.get(achat.membreId) ?? 0) + commission.montant);
      }
    }

    return {
      pack: dernierPack
        ? { nom: dernierPack.nom, prix: dernierPack.prix, pv: dernierPack.pointsPv, niveauRequisCode: dernierPack.niveauRequisCode }
        : null,
      volumePersonnel: confirmes.reduce((total, achat) => total + (packParId.get(achat.packId)?.pointsPv ?? 0), 0),
      commissionsDuMois,
      commissionsTotales,
      commissionParFilleul,
    };
  }

  private construireArbre(soi: ParrainageMlm, tous: ParrainageMlm[], annuaire: Annuaire): NoeudReseau[] {
    const enfantsDe = (parent: ParrainageMlm, parrainNom: string | null): NoeudReseau[] =>
      tous
        .filter((p) => p.profondeur === parent.profondeur + 1 && p.chemin.startsWith(`${parent.chemin}.`))
        .map((p) => ({ p, fiche: annuaire.get(p.membreId) }))
        .filter((entree): entree is { p: ParrainageMlm; fiche: FicheMembre } => entree.fiche !== undefined)
        .map(({ p, fiche }) => {
          const profondeur = p.profondeur - soi.profondeur;
          return {
            membre: fiche,
            relation: profondeur === 1 ? ('direct' as const) : ('indirect' as const),
            profondeur,
            parrainNom: profondeur === 1 ? null : parrainNom,
            enfants: enfantsDe(p, fiche.nom),
          };
        });
    return enfantsDe(soi, null);
  }

  /** Jours écoulés depuis la plus ancienne cotisation due et non payée, toutes vagues confondues. */
  private async joursDeRetard(membreId: string): Promise<number | null> {
    const maintenant = new Date();
    let plusAncienne: Date | null = null;
    for (const { participation } of await this.participationActive.lister(membreId)) {
      const payees = (await this.cotisations.listerParParticipation(participation.id!)).filter((c) => c.statut === 'payee').length;
      if (payees < participation.cotisationsAttendues(maintenant)) {
        const echeance = participation.echeance(payees + 1);
        if (!plusAncienne || echeance < plusAncienne) {
          plusAncienne = echeance;
        }
      }
    }
    return plusAncienne ? Math.max(1, Math.round((maintenant.getTime() - plusAncienne.getTime()) / JOUR_MS)) : null;
  }
}
