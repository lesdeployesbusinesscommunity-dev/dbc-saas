import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupeTontine, MEMBRES_MAXIMUM_PAR_VAGUE } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { TourTontine } from '../domaine/tour-tontine';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { ParticipationTontine } from '../domaine/participation-tontine';
import { AffectationVagueService } from './affectation-vague.service';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface CreerGroupeTontineCommande {
  codeNiveau: string;
  responsableMembreId?: string | null;
}

/**
 * Cas d'utilisation 4.1 — l'administrateur ouvre une nouvelle vague pour un
 * niveau (plusieurs vagues par niveau quand il y a du monde). La cotisation et
 * la cagnotte sont reprises du niveau. Les membres en liste d'attente de ce
 * niveau y entrent aussitôt, par ordre d'inscription, dans la limite des places.
 */
@Injectable()
export class CreerGroupeTontineUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly affectation: AffectationVagueService,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(
    commande: CreerGroupeTontineCommande,
  ): Promise<{ groupe: GroupeTontine; membresAffectes: ParticipationTontine[] }> {
    const niveau = await this.niveaux.trouverParCode(commande.codeNiveau);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    if (commande.responsableMembreId && !(await this.membres.trouverParId(commande.responsableMembreId))) {
      throw new NotFoundException('Responsable introuvable parmi les membres');
    }

    const resultat = GroupeTontine.creer({
      niveauId: niveau.id,
      numero: (await this.groupes.compterParNiveau(niveau.id)) + 1,
      cotisationMensuelle: niveau.cotisationMensuelle,
      montantCagnotte: niveau.montantCagnotte,
      responsableMembreId: commande.responsableMembreId ?? null,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const groupe = await this.groupes.sauvegarder(resultat.valeur!);
    await this.tours.sauvegarder(TourTontine.ouvrir({ groupeId: groupe.id!, numero: 1, montant: groupe.montantCagnotte }));

    const enAttente = (await this.attente.listerEnAttente(niveau.id)).slice(0, MEMBRES_MAXIMUM_PAR_VAGUE);
    const membresAffectes: ParticipationTontine[] = [];
    for (const inscription of enAttente) {
      membresAffectes.push(await this.affectation.ajouter(groupe, inscription.membreId));
      inscription.affecter(groupe.id!);
      await this.attente.sauvegarder(inscription);
    }

    await this.enregistrerAudit.executer({
      action: 'vague_tontine_creee',
      typeEntite: 'GroupeTontine',
      acteurId: null,
      metadonnees: { groupeId: groupe.id, niveau: niveau.code, numero: groupe.numero, membresAffectes: membresAffectes.length },
    });

    return { groupe, membresAffectes };
  }
}
