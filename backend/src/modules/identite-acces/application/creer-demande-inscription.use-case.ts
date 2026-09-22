import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DemandeInscription } from '../domaine/demande-inscription';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';

export interface CreerDemandeInscriptionCommande {
  nom: string;
  prenom: string;
  age: number;
  pays: string;
  telephone: string;
  codeParrain?: string;
  niveauSouhaiteCode: string;
}

/**
 * Orchestration pure. Correspond au premier pas du processus d'adhésion réel :
 * un visiteur soumet ses informations, un admin les valide plus tard (voir
 * ValiderDemandeInscriptionUseCase) — aucun compte n'est créé à cette étape.
 */
@Injectable()
export class CreerDemandeInscriptionUseCase {
  constructor(
    private readonly demandes: DemandeInscriptionRepositoryPort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
  ) {}

  async executer(commande: CreerDemandeInscriptionCommande): Promise<DemandeInscription> {
    const compteExistant = await this.utilisateurs.trouverParTelephone(commande.telephone);
    if (compteExistant) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    const demandeExistante = await this.demandes.trouverEnAttenteParTelephone(commande.telephone);
    if (demandeExistante) {
      throw new ConflictException('Une demande est déjà en attente pour ce numéro de téléphone');
    }

    const resultat = DemandeInscription.creer(commande);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }

    return this.demandes.sauvegarder(resultat.valeur!);
  }
}
