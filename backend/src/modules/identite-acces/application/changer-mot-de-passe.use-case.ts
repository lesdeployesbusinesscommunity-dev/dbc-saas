import { BadRequestException, Injectable } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { ParametresPlateformeService } from '../../parametres-plateforme/application/parametres-plateforme.service';

/**
 * Le membre remplace son mot de passe (notamment le mot de passe temporaire
 * choisi par l'admin à la validation de sa demande). L'ancien est exigé :
 * une session laissée ouverte ne suffit pas à s'approprier le compte. Le
 * nouveau doit respecter la règle choisie dans les Paramètres de la plateforme.
 */
@Injectable()
export class ChangerMotDePasseUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly parametres: ParametresPlateformeService,
  ) {}

  async executer(commande: { utilisateur: Utilisateur; motDePasseActuel: string; nouveauMotDePasse: string }): Promise<void> {
    const valide = await this.hacheur.verifier(commande.motDePasseActuel, commande.utilisateur.motDePasseHache);
    if (!valide) {
      // 400 et non 401 : le membre est bien connecté, il s'est seulement trompé de mot de passe.
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    await this.parametres.exigerMotDePasseConforme(commande.nouveauMotDePasse);
    commande.utilisateur.changerMotDePasse(await this.hacheur.hacher(commande.nouveauMotDePasse));
    await this.utilisateurs.sauvegarder(commande.utilisateur);
  }
}
