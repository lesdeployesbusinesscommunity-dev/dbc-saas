import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { ProfilMembre } from '../../adhesion/domaine/membre';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';

export interface MettreAJourProfilCommande {
  utilisateur: Utilisateur;
  profil: Partial<ProfilMembre>;
  email?: string | null;
  telephone?: string;
}

/**
 * Paramètres > Profil de l'espace membre. Le profil (nom, ville, profession,
 * photo) appartient au Membre (Adhésion), l'e-mail et le numéro WhatsApp au
 * compte (Identité & accès). Le numéro sert aussi à se connecter : il doit
 * rester unique.
 */
@Injectable()
export class MettreAJourProfilUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  async executer(commande: MettreAJourProfilCommande): Promise<void> {
    const membre = await this.membres.trouverParId(commande.utilisateur.id!);
    if (!membre) {
      throw new NotFoundException('Aucune adhésion pour ce compte');
    }

    const utilisateur = commande.utilisateur;
    let compteModifie = false;
    if (commande.email !== undefined) {
      utilisateur.changerEmail(commande.email?.trim() || undefined);
      compteModifie = true;
    }
    if (commande.telephone !== undefined && commande.telephone !== utilisateur.telephone) {
      const existant = await this.utilisateurs.trouverParTelephone(commande.telephone);
      if (existant && existant.id !== utilisateur.id) {
        throw new ConflictException('Ce numéro est déjà utilisé par un autre compte');
      }
      const resultat = utilisateur.changerTelephone(commande.telephone);
      if (!resultat.succes) {
        throw new BadRequestException(resultat.erreur);
      }
      compteModifie = true;
    }
    if (compteModifie) {
      await this.utilisateurs.sauvegarder(utilisateur);
    }

    membre.mettreAJourProfil(commande.profil);
    await this.membres.sauvegarder(membre);
  }
}
