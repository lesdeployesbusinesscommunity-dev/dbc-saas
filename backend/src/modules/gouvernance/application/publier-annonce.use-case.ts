import { Injectable } from '@nestjs/common';
import { Annonce } from '../domaine/annonce';
import { AnnonceRepositoryPort } from '../domaine/annonce.repository.port';

export interface PublierAnnonceCommande {
  titre: string;
  contenu: string;
  auteurId?: string | null;
  niveauCibleId?: number | null;
}

/** Cas d'utilisation 10.1 — "Publier une annonce" (Directeur / Administrateur). */
@Injectable()
export class PublierAnnonceUseCase {
  constructor(private readonly annonces: AnnonceRepositoryPort) {}

  async executer(commande: PublierAnnonceCommande): Promise<Annonce> {
    return this.annonces.sauvegarder(Annonce.publier(commande));
  }
}
