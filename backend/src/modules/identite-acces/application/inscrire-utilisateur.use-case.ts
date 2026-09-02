import { ConflictException, Injectable } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';

export interface InscrireUtilisateurCommande {
  telephone: string;
  email?: string;
  motDePasse: string;
}

/**
 * Orchestration pure : aucune logique métier ici, elle vit dans l'entité.
 * Ce use-case ne fait que coordonner domaine, hachage et persistance.
 */
@Injectable()
export class InscrireUtilisateurUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
  ) {}

  async executer(commande: InscrireUtilisateurCommande): Promise<Utilisateur> {
    const existant = await this.utilisateurs.trouverParTelephone(commande.telephone);
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    const motDePasseHache = await this.hacheur.hacher(commande.motDePasse);
    const resultat = Utilisateur.creer({
      telephone: commande.telephone,
      email: commande.email,
      motDePasseHache,
    });
    if (!resultat.succes) {
      throw new ConflictException(resultat.erreur);
    }

    return this.utilisateurs.sauvegarder(resultat.valeur!);
  }
}
