import { Injectable, BadRequestException } from '@nestjs/common';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';

/**
 * Cas d'utilisation "Réordonner les pôles de gouvernance" (Administrateur) —
 * remplace "monter"/"descendre" (mutation locale dans l'ancienne maquette) :
 * le frontend envoie la liste complète des ids dans le nouvel ordre voulu.
 */
@Injectable()
export class ReordonnerPolesUseCase {
  constructor(private readonly poles: PoleRepositoryPort) {}

  async executer(idsDansLOrdre: number[]): Promise<void> {
    const tousPoles = await this.poles.listerTous();
    if (idsDansLOrdre.length !== tousPoles.length) {
      throw new BadRequestException('La liste doit contenir tous les pôles existants');
    }

    const poleParId = new Map(tousPoles.map((p) => [p.id, p]));
    await Promise.all(
      idsDansLOrdre.map((id, index) => {
        const pole = poleParId.get(id);
        if (!pole) {
          throw new BadRequestException(`Pôle ${id} introuvable`);
        }
        pole.deplacerA(index + 1);
        return this.poles.sauvegarder(pole);
      }),
    );
  }
}
