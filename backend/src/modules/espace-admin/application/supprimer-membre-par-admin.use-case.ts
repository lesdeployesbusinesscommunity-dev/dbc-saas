import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UtilisateurRepositoryPort } from '../../identite-acces/domaine/utilisateur.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

/**
 * "Supprimer" un membre depuis "Gestion des membres" : son compte est fermé
 * (plus de connexion, plus visible dans les listes) mais rien de son
 * historique n'est effacé — ses cotisations comptent toujours dans les
 * caisses de tontine, ses filleuls gardent leur place dans l'arbre.
 */
@Injectable()
export class SupprimerMembreParAdminUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(membreId: string): Promise<void> {
    const utilisateur = await this.utilisateurs.trouverParId(membreId);
    if (!utilisateur) {
      throw new NotFoundException('Membre introuvable');
    }
    const resultat = utilisateur.supprimer();
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    await this.utilisateurs.sauvegarder(utilisateur);
    await this.enregistrerAudit.executer({
      action: 'membre_supprime_par_admin',
      typeEntite: 'Membre',
      acteurId: null,
      metadonnees: { membreId },
    });
  }
}
