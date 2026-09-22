import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Membre } from '../domaine/membre';
import { MembreRepositoryPort } from '../domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../domaine/niveau-adhesion.repository.port';
import { HistoriqueNiveauMembre } from '../domaine/historique-niveau-membre';
import { genererMatricule } from '../domaine/matricule';

export interface ChoisirNiveauAdhesionCommande {
  utilisateurId: string;
  codeNiveau: string;
}

/**
 * Orchestration pure. Correspond au cas d'utilisation 2.1 du cahier de
 * conception — inclus par "S'inscrire" (1.1), mais implémenté ici comme une
 * étape distincte de l'onboarding (cahier des charges §4.1 : "Onboarding
 * guidé 3 étapes — Bienvenue / Mon niveau / Ma première tontine"), pour ne
 * pas coupler le module Identité & accès au module Adhésion.
 */
@Injectable()
export class ChoisirNiveauAdhesionUseCase {
  constructor(
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(commande: ChoisirNiveauAdhesionCommande): Promise<Membre> {
    const existant = await this.membres.trouverParId(commande.utilisateurId);
    if (existant) {
      throw new ConflictException('Un niveau a déjà été choisi pour ce compte');
    }

    const niveau = await this.niveaux.trouverParCode(commande.codeNiveau);
    if (!niveau) {
      throw new NotFoundException('Niveau d’adhésion inconnu');
    }

    const numeroSequence = await this.membres.prochainNumeroSequenceMatricule();
    const matricule = genererMatricule(new Date().getFullYear(), numeroSequence);

    const membre = Membre.creer({ id: commande.utilisateurId, matricule, niveauActuelId: niveau.id });
    const membreSauvegarde = await this.membres.sauvegarder(membre);

    await this.membres.ajouterHistorique(
      HistoriqueNiveauMembre.ouvrir({
        membreId: membreSauvegarde.id,
        niveauId: niveau.id,
        motif: 'Choix initial du niveau à l’inscription',
      }),
    );

    return membreSauvegarde;
  }
}
