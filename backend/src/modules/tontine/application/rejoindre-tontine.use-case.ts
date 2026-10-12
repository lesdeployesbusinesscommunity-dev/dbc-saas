import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { ParticipationActiveService } from './participation-active.service';
import { AffectationVagueService } from './affectation-vague.service';
import { CotiserUseCase } from './cotiser.use-case';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface RejoindreTontineCommande {
  membreId: string;
  telephone: string;
  /** Niveau de la vague visée ; par défaut, le niveau d'adhésion du membre. */
  codeNiveau?: string;
  /** Vrai : le membre préfère attendre la prochaine vague plutôt qu'entrer dans la plus récente. */
  attendreProchaineVague: boolean;
}

export type ResultatRejoindre =
  | { statut: 'vague'; groupe: GroupeTontine; participation: ParticipationTontine; premiereCotisation: CotisationTontine }
  | { statut: 'liste_attente'; inscription: InscriptionAttenteTontine };

/**
 * Cas d'utilisation 4.2 — inclut "Initier un paiement" (1re cotisation, pour
 * DBC). Un membre peut cotiser à plusieurs niveaux, mais jamais au-dessus de
 * son niveau d'adhésion, et une seule vague active par niveau. Il entre dans
 * la vague la plus récente du niveau choisi si elle a encore de la place ;
 * sinon (ou s'il le demande), il est inscrit sur la liste d'attente de la
 * prochaine vague de ce niveau.
 */
@Injectable()
export class RejoindreTontineUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly participationActive: ParticipationActiveService,
    private readonly affectation: AffectationVagueService,
    private readonly cotiser: CotiserUseCase,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: RejoindreTontineCommande): Promise<ResultatRejoindre> {
    const membre = await this.membres.trouverParId(commande.membreId);
    if (!membre) {
      throw new NotFoundException('Membre introuvable : choisissez d’abord un niveau d’adhésion');
    }
    const niveau = commande.codeNiveau
      ? await this.niveaux.trouverParCode(commande.codeNiveau)
      : await this.niveaux.trouverParId(membre.niveauActuelId);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    // Les niveaux sont semés dans l'ordre (id croissant = rang croissant) — voir AdhesionBootstrap.
    if (niveau.id > membre.niveauActuelId) {
      throw new BadRequestException('Vous ne pouvez pas rejoindre une vague d’un niveau supérieur au vôtre');
    }
    if (await this.participationActive.trouver(membre.id, niveau.id)) {
      throw new BadRequestException(`Vous faites déjà partie d’une vague ${niveau.nom} en cours`);
    }
    if (await this.attente.trouverEnAttentePourMembre(membre.id, niveau.id)) {
      throw new BadRequestException(`Vous êtes déjà sur la liste d’attente de la prochaine vague ${niveau.nom}`);
    }

    if (!commande.attendreProchaineVague) {
      const plusRecente = (await this.groupes.lister(niveau.id)).find((g) => g.statut === 'en_cours');
      if (plusRecente) {
        const membresVague = await this.participations.listerParGroupe(plusRecente.id!);
        if (plusRecente.peutAccueillir(membresVague.length).succes) {
          const participation = await this.affectation.ajouter(plusRecente, membre.id);
          await this.enregistrerAudit.executer({
            action: 'vague_tontine_rejointe',
            typeEntite: 'ParticipationTontine',
            acteurId: membre.id,
            metadonnees: { groupeId: plusRecente.id, rang: participation.rang },
          });
          const { cotisation } = await this.cotiser.executer({
            membreId: membre.id,
            telephone: commande.telephone,
            niveauId: niveau.id,
          });
          return { statut: 'vague', groupe: plusRecente, participation, premiereCotisation: cotisation };
        }
      }
    }

    const inscription = await this.attente.sauvegarder(
      InscriptionAttenteTontine.creer({ membreId: membre.id, niveauId: niveau.id }),
    );
    return { statut: 'liste_attente', inscription };
  }
}
