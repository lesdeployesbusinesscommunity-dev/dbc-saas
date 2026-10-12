import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lecon } from '../domaine/lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';

export interface AjouterLeconCommande {
  moduleFormationId: string;
  titre: string;
  urlVideo: string;
}

/** Création de contenu (Lecon) par un administrateur — voir EnregistrerFormationUseCase pour la création complète. */
@Injectable()
export class AjouterLeconUseCase {
  constructor(
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
  ) {}

  async executer(commande: AjouterLeconCommande): Promise<Lecon> {
    const module = await this.modules.trouverParId(commande.moduleFormationId);
    if (!module) {
      throw new NotFoundException('Module de formation introuvable');
    }

    const resultat = Lecon.creer({
      moduleFormationId: commande.moduleFormationId,
      titre: commande.titre,
      type: 'video',
      url: commande.urlVideo,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    return this.lecons.sauvegarder(resultat.valeur!);
  }
}
