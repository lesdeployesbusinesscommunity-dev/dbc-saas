import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgressionLecon } from '../domaine/progression-lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';

export interface SuivreLeconCommande {
  membreId: string;
  leconId: string;
}

/**
 * Cas d'utilisation 7.2 du cahier de conception — "Suivre une leçon".
 *
 * Le diagramme d'activité du Cahier de conception déclenche un gain de
 * coins dès qu'un module est visionné en entier. Le Cahier des Charges §5.1
 * est plus strict : le gain de coins et le certificat ne sont acquis qu'à la
 * validation de la formation entière via ses quiz (score ≥ seuil) — voir
 * PasserQuizUseCase. Suivre une leçon ne fait donc que marquer la
 * progression ; la leçon devient un prérequis du quiz de son module.
 */
@Injectable()
export class SuivreLeconUseCase {
  constructor(
    private readonly lecons: LeconRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
  ) {}

  async executer(commande: SuivreLeconCommande): Promise<ProgressionLecon> {
    const lecon = await this.lecons.trouverParId(commande.leconId);
    if (!lecon) {
      throw new NotFoundException('Leçon introuvable');
    }
    const moduleFormation = await this.modules.trouverParId(lecon.moduleFormationId);
    if (!moduleFormation) {
      throw new NotFoundException('Module de formation introuvable');
    }

    const inscription = await this.inscriptions.trouverParMembreEtFormation(
      commande.membreId,
      moduleFormation.formationId,
    );
    if (!inscription) {
      throw new BadRequestException('Inscription à la formation requise avant de suivre une leçon');
    }

    const existante = await this.progressions.trouverParInscriptionEtLecon(inscription.id!, lecon.id!);
    if (existante?.terminee) {
      return existante;
    }

    const progression = existante ?? ProgressionLecon.creer({ inscriptionId: inscription.id!, leconId: lecon.id! });
    progression.marquerTerminee();
    return this.progressions.sauvegarder(progression);
  }
}
