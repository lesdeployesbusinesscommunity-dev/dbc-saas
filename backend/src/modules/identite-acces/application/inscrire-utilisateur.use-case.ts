import { ConflictException, Injectable } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';

export interface InscrireUtilisateurCommande {
  telephone: string;
  email?: string;
  motDePasseHache: string;
}

/**
 * Orchestration pure : aucune logique métier ici, elle vit dans l'entité.
 * Ce use-case ne fait que coordonner domaine + persistance.
 */
@Injectable()
export class InscrireUtilisateurUseCase {
  constructor(private readonly utilisateurs: UtilisateurRepositoryPort) {}

  async executer(commande: InscrireUtilisateurCommande): Promise<Utilisateur> {
    const existant = await this.utilisateurs.trouverParTelephone(commande.telephone);
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    const resultat = Utilisateur.creer(commande);
    if (!resultat.succes) {
      throw new ConflictException(resultat.erreur);
    }

    return this.utilisateurs.sauvegarder(resultat.valeur!);
  }
}
