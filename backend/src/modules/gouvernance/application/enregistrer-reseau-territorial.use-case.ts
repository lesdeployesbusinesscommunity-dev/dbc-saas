import { BadRequestException, Injectable } from '@nestjs/common';
import { NoeudReseau, ReseauTerritorial } from '../domaine/reseau-territorial';
import { ReseauTerritorialRepositoryPort } from '../domaine/reseau-territorial.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerAuditUseCase } from './enregistrer-audit.use-case';

/**
 * "Gestion du réseau" (administrateur) : enregistre l'organisation d'un pays
 * — arbre des branches avec leurs responsables et coordinateurs, titres de
 * chaque échelon. L'interface envoie l'arbre entier après chaque changement
 * (ajouter une branche, assigner un responsable...). Un arbre vide efface
 * l'organisation du pays. Chaque membre placé doit exister.
 */
@Injectable()
export class EnregistrerReseauTerritorialUseCase {
  constructor(
    private readonly reseaux: ReseauTerritorialRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: {
    pays: string;
    racine: NoeudReseau | null;
    titresNiveaux: Record<string, string>;
  }): Promise<ReseauTerritorial> {
    const pays = commande.pays.trim();
    if (!pays) {
      throw new BadRequestException('Le pays est obligatoire');
    }
    const reseau = (await this.reseaux.trouverParPays(pays)) ?? ReseauTerritorial.vide(pays);
    const resultat = reseau.remplacer(commande.racine, commande.titresNiveaux);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    const connus = new Set((await this.membres.listerTous()).map((m) => m.id));
    const inconnu = reseau.membresPlaces().find((id) => !connus.has(id));
    if (inconnu) {
      throw new BadRequestException('Un membre placé dans le réseau est introuvable');
    }

    const sauvegarde = await this.reseaux.sauvegarder(reseau);
    await this.enregistrerAudit.executer({
      action: 'reseau_territorial_modifie',
      typeEntite: 'ReseauTerritorial',
      acteurId: null,
      metadonnees: { pays, membresPlaces: reseau.membresPlaces().length },
    });
    return sauvegarde;
  }
}
