import { BadRequestException, Injectable } from '@nestjs/common';
import { ProgressionLecon } from '../domaine/progression-lecon';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { ProgressionFormationService } from './progression-formation.service';

export interface SuivreLeconCommande {
  membreId: string;
  leconId: string;
}

/**
 * Cas d'utilisation 7.2 du cahier de conception — "Suivre une leçon" : une
 * vidéo regardée ou un support PDF ouvert compte comme une leçon terminée.
 * Un quiz, lui, ne compte qu'une fois réussi (voir RepondreQuizLeconUseCase).
 * L'inscription à la formation se fait d'elle-même à la première leçon ; la
 * dernière leçon terminée achève la formation (certificat + Coins).
 */
@Injectable()
export class SuivreLeconUseCase {
  constructor(
    private readonly suivi: ProgressionFormationService,
    private readonly progressions: ProgressionLeconRepositoryPort,
  ) {}

  async executer(commande: SuivreLeconCommande): Promise<{ progression: ProgressionLecon; formationTerminee: boolean }> {
    const { lecon, formation } = await this.suivi.trouverLecon(commande.leconId);
    if (lecon.type === 'quiz') {
      throw new BadRequestException('Un quiz se valide en y répondant');
    }
    const inscription = await this.suivi.inscription(commande.membreId, formation);
    this.suivi.exigerPrerequis(formation, inscription);

    const progression = await this.suivi.progression(inscription, lecon);
    if (!progression.terminee) {
      progression.marquerTerminee();
    }
    const sauvegardee = await this.progressions.sauvegarder(progression);
    const formationTerminee = await this.suivi.verifierAchevement(inscription, formation);
    return { progression: sauvegardee, formationTerminee };
  }
}
