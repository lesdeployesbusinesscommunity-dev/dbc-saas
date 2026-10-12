import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';

/**
 * Le membre remplace son mot de passe (notamment le mot de passe temporaire
 * choisi par l'admin à la validation de sa demande). L'ancien est exigé :
 * une session laissée ouverte ne suffit pas à s'approprier le compte.
 */
@Injectable()
export class ChangerMotDePasseUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
  ) {}

  async executer(commande: { utilisateur: Utilisateur; motDePasseActuel: string; nouveauMotDePasse: string }): Promise<void> {
    const valide = await this.hacheur.verifier(commande.motDePasseActuel, commande.utilisateur.motDePasseHache);
    if (!valide) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    commande.utilisateur.changerMotDePasse(await this.hacheur.hacher(commande.nouveauMotDePasse));
    await this.utilisateurs.sauvegarder(commande.utilisateur);
  }
}
