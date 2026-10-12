import { Injectable, NotFoundException } from '@nestjs/common';
import { Siege } from '../domaine/siege';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';

export interface SiegeSaisi {
  /** Présent pour un siège existant à renommer ; absent pour un nouveau siège. */
  id?: string;
  titre: string;
}

export interface ModifierPoleCommande {
  poleId: number;
  nom: string;
  description: string;
  icone: string;
  sieges: SiegeSaisi[];
}

/**
 * Cas d'utilisation "Modifier un pôle de gouvernance" (Administrateur) —
 * conforme à PoleFormModal.jsx : la liste de sièges soumise remplace la
 * précédente (les sièges déjà occupés gardent leur titulaire tant que leur
 * id revient dans la liste ; un id absent de la liste est un siège retiré
 * par l'admin et son titulaire éventuel est libéré avec lui).
 */
@Injectable()
export class ModifierPoleUseCase {
  constructor(
    private readonly poles: PoleRepositoryPort,
    private readonly sieges: SiegeRepositoryPort,
  ) {}

  async executer(commande: ModifierPoleCommande): Promise<void> {
    const pole = await this.poles.trouverParId(commande.poleId);
    if (!pole) {
      throw new NotFoundException('Pôle introuvable');
    }

    pole.renommer({ nom: commande.nom, description: commande.description, icone: commande.icone });
    await this.poles.sauvegarder(pole);

    const siegesExistants = await this.sieges.listerParPoleId(commande.poleId);
    const siegeExistantParId = new Map(siegesExistants.map((s) => [s.id, s]));
    const idsConserves = new Set(commande.sieges.filter((s) => s.id).map((s) => s.id));

    await Promise.all(
      siegesExistants.filter((s) => !idsConserves.has(s.id)).map((s) => this.sieges.supprimer(s.id!)),
    );

    await Promise.all(
      commande.sieges.map((siegeSaisi, index) => {
        const existant = siegeSaisi.id ? siegeExistantParId.get(siegeSaisi.id) : undefined;
        if (existant) {
          existant.renommer(siegeSaisi.titre);
          existant.ordre = index + 1;
          return this.sieges.sauvegarder(existant);
        }
        return this.sieges.sauvegarder(
          Siege.creer({ poleId: commande.poleId, titre: siegeSaisi.titre, ordre: index + 1 }),
        );
      }),
    );
  }
}
