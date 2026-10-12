import { Injectable, NotFoundException } from '@nestjs/common';
import { calculerCaisse } from '../domaine/caisse';
import { MoisVague, calculerCalendrierVague } from '../domaine/calendrier-vague';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { COTISATIONS_PAR_MEMBRE, ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { ParticipationActiveService } from './participation-active.service';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesion } from '../../adhesion/domaine/niveau-adhesion';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface MembreDeLaVague {
  membreId: string;
  nom: string;
  ville: string | null;
  rang: number;
  estMoi: boolean;
  /** Une case par cotisation déjà due depuis son entrée : payée ou non. */
  historique: boolean[];
  cotisationsPayees: number;
  cotisationsAttendues: number;
  enRetard: boolean;
  beneficiaireLe: Date | null;
}

export interface MaVague {
  groupe: GroupeTontine;
  participation: ParticipationTontine;
  cotisations: CotisationTontine[];
  cotisationsPayees: number;
  cotisationsAttendues: number;
  enRetard: boolean;
  /** Prochaine échéance, ou null si les 12 cotisations sont payées. */
  prochaineEcheance: Date | null;
  /** Montant à déposer pour la prochaine cotisation (cotisation + frais de retrait). */
  montantProchainDepot: number;
  /** Nombre de membres qui bouffent avant moi (0 = je suis le prochain), null si j'ai déjà bouffé. */
  membresAvantMoi: number | null;
  caisse: number;
  membres: MembreDeLaVague[];
  calendrier: MoisVague[];
}

export interface VagueTerminee {
  groupe: GroupeTontine;
  monRang: number;
  nombreDeMembres: number;
  recuLe: Date | null;
}

export interface VueTontineMembre {
  niveau: NiveauAdhesion;
  vague: MaVague | null;
  listeAttente: InscriptionAttenteTontine | null;
  historique: VagueTerminee[];
}

/**
 * Cas d'utilisation 4.5 — "Consulter ma tontine", pour UN niveau (un membre
 * peut cotiser à plusieurs). Réunit tout ce que la page "Ma Tontine" de
 * l'espace membre affiche : ma vague et ses membres (avec leur suivi de
 * cotisation), le calendrier des bouffes (réel puis projeté), ma prochaine
 * échéance, ma place dans la file, et mes vagues déjà terminées à ce niveau.
 */
@Injectable()
export class ConsulterMaTontineUseCase {
  constructor(
    private readonly participationActive: ParticipationActiveService,
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly frais: FraisRetraitTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(membreId: string, niveauId: number): Promise<VueTontineMembre> {
    const niveau = await this.niveaux.trouverParId(niveauId);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    const [listeAttente, active, historique] = await Promise.all([
      this.attente.trouverEnAttentePourMembre(membreId, niveauId),
      this.participationActive.trouver(membreId, niveauId),
      this.historique(membreId, niveauId),
    ]);
    return {
      niveau,
      listeAttente,
      historique,
      vague: active ? await this.maVague(membreId, active.groupe, active.participation) : null,
    };
  }

  private async maVague(membreId: string, groupe: GroupeTontine, participation: ParticipationTontine): Promise<MaVague> {
    const maintenant = new Date();
    const [cotisationsVague, tours, membresVague, fraisNiveau] = await Promise.all([
      this.cotisations.listerParGroupe(groupe.id!),
      this.tours.listerParGroupe(groupe.id!),
      this.participations.listerParGroupe(groupe.id!),
      this.frais.trouverParNiveau(groupe.niveauId),
    ]);
    const caisse = calculerCaisse(cotisationsVague, tours);

    const membres: MembreDeLaVague[] = [];
    for (const p of membresVague) {
      const siennes = cotisationsVague.filter((c) => c.participationId === p.id && c.statut === 'payee');
      const numerosPayes = new Set(siennes.map((c) => c.numero));
      const attendues = p.cotisationsAttendues(maintenant);
      const membre = await this.membres.trouverParId(p.membreId);
      membres.push({
        membreId: p.membreId,
        nom: membre?.nomComplet ?? 'Membre',
        ville: [membre?.profil.ville, membre?.profil.pays].filter(Boolean).join(', ') || null,
        rang: p.rang,
        estMoi: p.membreId === membreId,
        historique: Array.from({ length: attendues }, (_, i) => numerosPayes.has(i + 1)),
        cotisationsPayees: siennes.length,
        cotisationsAttendues: attendues,
        enRetard: siennes.length < attendues,
        beneficiaireLe: p.beneficiaireLe,
      });
    }

    const calendrier = calculerCalendrierVague({
      ouverteLe: groupe.creeLe,
      maintenant,
      cagnotte: groupe.montantCagnotte,
      cotisationMensuelle: groupe.cotisationMensuelle,
      caisseActuelle: caisse,
      participants: membresVague.map((p) => {
        const payees = cotisationsVague.filter((c) => c.participationId === p.id && c.statut === 'payee');
        return {
          membreId: p.membreId,
          rang: p.rang,
          beneficiaireLe: p.beneficiaireLe,
          cotisationsCaisseRestantes: COTISATIONS_PAR_MEMBRE - 1 - payees.filter((c) => c.destination === 'caisse').length,
        };
      }),
    });

    const moi = membres.find((m) => m.estMoi)!;
    const miennes = cotisationsVague.filter((c) => c.participationId === participation.id);
    return {
      groupe,
      participation,
      cotisations: miennes,
      cotisationsPayees: moi.cotisationsPayees,
      cotisationsAttendues: moi.cotisationsAttendues,
      enRetard: moi.enRetard,
      prochaineEcheance:
        moi.cotisationsPayees < COTISATIONS_PAR_MEMBRE ? participation.echeance(moi.cotisationsPayees + 1) : null,
      montantProchainDepot: groupe.cotisationMensuelle + (fraisNiveau?.montant ?? 0),
      membresAvantMoi: participation.aBouffe
        ? null
        : membresVague.filter((m) => !m.aBouffe && m.rang < participation.rang).length,
      caisse,
      membres,
      calendrier,
    };
  }

  private async historique(membreId: string, niveauId: number): Promise<VagueTerminee[]> {
    const terminees: VagueTerminee[] = [];
    for (const participation of await this.participations.listerParMembre(membreId)) {
      const groupe = await this.groupes.trouverParId(participation.groupeId);
      if (!groupe || groupe.niveauId !== niveauId || groupe.statut !== 'terminee') {
        continue;
      }
      const membresVague = await this.participations.listerParGroupe(groupe.id!);
      terminees.push({
        groupe,
        monRang: participation.rang,
        nombreDeMembres: membresVague.length,
        recuLe: participation.beneficiaireLe,
      });
    }
    return terminees;
  }
}
