import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';
import { ChoisirNiveauAdhesionUseCase } from '../../adhesion/application/choisir-niveau-adhesion.use-case';
import { Membre } from '../../adhesion/domaine/membre';
import { EnregistrerParrainageUseCase } from '../../reseau-mlm/application/enregistrer-parrainage.use-case';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface ValiderDemandeInscriptionCommande {
  demandeId: string;
  motDePasseTemporaire: string;
}

export interface DemandeValidee {
  utilisateur: Utilisateur;
  membre: Membre;
}

/**
 * Orchestration d'onboarding complet : l'admin a vérifié l'identité du
 * visiteur hors-ligne (WhatsApp), choisit un mot de passe temporaire, et
 * cette action crée en une fois le compte (Utilisateur, "actif" directement)
 * et l'adhésion (Membre, avec matricule auto-généré — voir
 * ChoisirNiveauAdhesionUseCase du module Adhésion).
 *
 * Dépendance délibérée Identité → Adhésion et Identité → Réseau MLM (sens
 * inhabituel pour ce monolithe modulaire, où c'est plutôt Adhésion/MLM qui
 * dépendent des autres modules) : l'onboarding est fondamentalement un seul
 * geste métier qui touche les trois bounded contexts (compte, adhésion,
 * position dans l'arbre de parrainage — cas d'utilisation 5.1).
 */
@Injectable()
export class ValiderDemandeInscriptionUseCase {
  constructor(
    private readonly demandes: DemandeInscriptionRepositoryPort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly choisirNiveau: ChoisirNiveauAdhesionUseCase,
    private readonly enregistrerParrainage: EnregistrerParrainageUseCase,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: ValiderDemandeInscriptionCommande): Promise<DemandeValidee> {
    const demande = await this.demandes.trouverParId(commande.demandeId);
    if (!demande) {
      throw new NotFoundException('Demande d’inscription introuvable');
    }

    const motDePasseHache = await this.hacheur.hacher(commande.motDePasseTemporaire);
    const resultatUtilisateur = Utilisateur.creerParAdmin({
      telephone: demande.telephone,
      motDePasseHache,
    });
    if (!resultatUtilisateur.succes) {
      throw new BadRequestException(resultatUtilisateur.erreur);
    }
    const utilisateur = await this.utilisateurs.sauvegarder(resultatUtilisateur.valeur!);

    const membre = await this.choisirNiveau.executer({
      utilisateurId: utilisateur.id!,
      codeNiveau: demande.niveauSouhaiteCode,
    });

    await this.enregistrerParrainage.executer({
      membreId: utilisateur.id!,
      matriculeParrain: demande.codeParrain,
    });

    const resultatValidation = demande.valider(utilisateur.id!);
    if (!resultatValidation.succes) {
      throw new BadRequestException(resultatValidation.erreur);
    }
    await this.demandes.sauvegarder(demande);

    await this.enregistrerAudit.executer({
      action: 'demande_inscription_validee',
      typeEntite: 'DemandeInscription',
      acteurId: null, // pas de vraie identité admin authentifiée — voir AdminSecretGuard
      metadonnees: { demandeId: demande.id, utilisateurId: utilisateur.id, matricule: membre.matricule },
    });

    return { utilisateur, membre };
  }
}
