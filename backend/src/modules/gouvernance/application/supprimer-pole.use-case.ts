import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';

/** Cas d'utilisation "Supprimer un pôle de gouvernance" (Administrateur). */
@Injectable()
export class SupprimerPoleUseCase {
  constructor(
    private readonly poles: PoleRepositoryPort,
    private readonly sieges: SiegeRepositoryPort,
  ) {}

  async executer(poleId: number): Promise<void> {
    const pole = await this.poles.trouverParId(poleId);
    if (!pole) {
      throw new NotFoundException('Pôle introuvable');
    }
    if (!pole.peutEtreSupprime) {
      throw new BadRequestException('La Direction fondatrice ne peut pas être supprimée');
    }

    const siegesDuPole = await this.sieges.listerParPoleId(poleId);
    await Promise.all(siegesDuPole.map((siege) => this.sieges.supprimer(siege.id!)));
    await this.poles.supprimer(poleId);
  }
}
