import { Injectable } from '@nestjs/common';
import { Pole } from '../domaine/pole';
import { Siege } from '../domaine/siege';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';

export interface CreerPoleCommande {
  nom: string;
  description: string;
  icone: string;
  titresSieges: string[];
}

// "founding-leadership" -> "founding-leadership" ; accents retirés, espaces
// en tirets. Un suffixe aléatoire est ajouté par l'appelant pour éviter une
// collision avec un pôle déjà renommé vers le même nom (code unique en base).
function slugifier(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cas d'utilisation "Ajouter un pôle de gouvernance" (Administrateur) —
 * conforme à la maquette frontend (Admin/Gouvernance, "Ajouter un pôle") :
 * un pôle "à postes nommés", placé en dernière position, avec ses sièges
 * tous vacants au départ.
 */
@Injectable()
export class CreerPoleUseCase {
  constructor(
    private readonly poles: PoleRepositoryPort,
    private readonly sieges: SiegeRepositoryPort,
  ) {}

  async executer(commande: CreerPoleCommande): Promise<{ pole: Pole; sieges: Siege[] }> {
    const tousPoles = await this.poles.listerTous();
    const ordre = tousPoles.reduce((max, p) => Math.max(max, p.ordre), 0) + 1;
    const code = `${slugifier(commande.nom)}-${Date.now().toString(36)}`;

    const poleCree = await this.poles.sauvegarder(
      Pole.creer({ code, nom: commande.nom, description: commande.description, ordre, icone: commande.icone }),
    );

    const siegesCrees = await Promise.all(
      commande.titresSieges.map((titre, index) =>
        this.sieges.sauvegarder(Siege.creer({ poleId: poleCree.id!, titre, ordre: index + 1 })),
      ),
    );

    return { pole: poleCree, sieges: siegesCrees };
  }
}
