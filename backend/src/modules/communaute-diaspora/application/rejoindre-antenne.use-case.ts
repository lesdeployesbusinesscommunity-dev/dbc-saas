import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MembreAntenne } from '../domaine/membre-antenne';
import { AntenneRepositoryPort } from '../domaine/antenne.repository.port';
import { MembreAntenneRepositoryPort } from '../domaine/membre-antenne.repository.port';

export interface RejoindreAntenneCommande {
  antenneId: string;
  membreId: string;
}

/** Cas d'utilisation 9.2 — "Rejoindre une antenne" (Membre). */
@Injectable()
export class RejoindreAntenneUseCase {
  constructor(
    private readonly antennes: AntenneRepositoryPort,
    private readonly membresAntenne: MembreAntenneRepositoryPort,
  ) {}

  async executer(commande: RejoindreAntenneCommande): Promise<MembreAntenne> {
    const antenne = await this.antennes.trouverParId(commande.antenneId);
    if (!antenne) {
      throw new NotFoundException('Antenne introuvable');
    }

    const dejaMembre = await this.membresAntenne.existeDeja(commande.antenneId, commande.membreId);
    if (dejaMembre) {
      throw new ConflictException('Déjà membre de cette antenne');
    }

    const resultat = MembreAntenne.rejoindre(antenne, commande.membreId);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    return this.membresAntenne.sauvegarder(resultat.valeur!);
  }
}
