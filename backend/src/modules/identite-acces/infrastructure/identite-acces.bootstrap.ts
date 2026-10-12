import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

/**
 * Migration de données, idempotente : les membres validés avant que le profil
 * ne soit porté par Membre (nom, ville, profession...) le récupèrent depuis
 * leur demande d'inscription. Sans effet une fois tous les profils remplis.
 */
@Injectable()
export class IdentiteAccesBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(IdentiteAccesBootstrap.name);

  constructor(
    private readonly demandes: DemandeInscriptionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const demandesValidees = (await this.demandes.listerToutes()).filter(
      (demande) => demande.statut === 'validee' && demande.utilisateurId,
    );

    let completes = 0;
    for (const demande of demandesValidees) {
      const membre = await this.membres.trouverParId(demande.utilisateurId!);
      if (!membre || membre.profil.nom) {
        continue;
      }
      membre.mettreAJourProfil({
        prenom: demande.prenom,
        nom: demande.nom,
        ville: demande.ville ?? null,
        pays: demande.pays,
        profession: demande.profession ?? null,
      });
      await this.membres.sauvegarder(membre);
      completes++;
    }

    if (completes > 0) {
      this.logger.log(`Profil recopié depuis la demande d'inscription pour ${completes} membre(s).`);
    }
  }
}
