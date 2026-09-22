import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Formation } from '../domaine/formation';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { PilierRepositoryPort } from '../../programmes/domaine/pilier.repository.port';

export interface CreerFormationCommande {
  code: string;
  titre: string;
  niveauRequisId: number;
  pilierCode: string;
}

/**
 * Création de contenu (Formation) par un administrateur. N'apparaît pas
 * comme cas d'utilisation distinct dans le cahier de conception (module 7
 * ne liste que des actions Membre) — nécessaire en pratique pour peupler le
 * catalogue de formations que 7.1/7.2/7.3 consomment. `niveauRequisId` et
 * `pilierCode` sont imposés par le Cahier des Charges §5.1/§3.2.
 */
@Injectable()
export class CreerFormationUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly piliers: PilierRepositoryPort,
  ) {}

  async executer(commande: CreerFormationCommande): Promise<Formation> {
    const existante = await this.formations.listerToutes();
    if (existante.some((f) => f.code === commande.code)) {
      throw new ConflictException('Une formation avec ce code existe déjà');
    }

    const niveauRequis = await this.niveaux.trouverParId(commande.niveauRequisId);
    if (!niveauRequis) {
      throw new NotFoundException('Niveau requis introuvable');
    }

    const piliers = await this.piliers.listerTous();
    if (!piliers.some((p) => p.code === commande.pilierCode)) {
      throw new NotFoundException('Pilier introuvable');
    }

    const formation = Formation.creer({
      code: commande.code,
      titre: commande.titre,
      niveauRequisId: commande.niveauRequisId,
      pilierCode: commande.pilierCode,
    });
    return this.formations.sauvegarder(formation);
  }
}
