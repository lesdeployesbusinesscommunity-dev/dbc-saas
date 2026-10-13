import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../../identite-acces/domaine/utilisateur.repository.port';
import { HacheurMotDePassePort } from '../../identite-acces/domaine/hacheur-mot-de-passe.port';
import { ChoisirNiveauAdhesionUseCase } from '../../adhesion/application/choisir-niveau-adhesion.use-case';
import { Membre, ProfilMembre } from '../../adhesion/domaine/membre';
import { EnregistrerParrainageUseCase } from '../../reseau-mlm/application/enregistrer-parrainage.use-case';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface CreerMembreParAdminCommande {
  telephone: string;
  email?: string;
  motDePasseTemporaire: string;
  codeNiveau: string;
  matriculeParrain?: string;
  profil: Partial<ProfilMembre>;
}

/**
 * "Ajouter un membre" depuis "Gestion des membres" : l'administrateur inscrit
 * lui-même une personne dont il a vérifié l'identité (même effet qu'une
 * demande d'inscription validée — compte actif, adhésion avec matricule
 * attribué automatiquement, place dans l'arbre de parrainage). Le membre se
 * connecte ensuite avec son matricule et le mot de passe temporaire.
 */
@Injectable()
export class CreerMembreParAdminUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly hacheur: HacheurMotDePassePort,
    private readonly choisirNiveau: ChoisirNiveauAdhesionUseCase,
    private readonly enregistrerParrainage: EnregistrerParrainageUseCase,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: CreerMembreParAdminCommande): Promise<Membre> {
    if (await this.utilisateurs.trouverParTelephone(commande.telephone)) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }
    const resultat = Utilisateur.creerParAdmin({
      telephone: commande.telephone,
      email: commande.email,
      motDePasseHache: await this.hacheur.hacher(commande.motDePasseTemporaire),
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const utilisateur = await this.utilisateurs.sauvegarder(resultat.valeur!);

    const membre = await this.choisirNiveau.executer({
      utilisateurId: utilisateur.id!,
      codeNiveau: commande.codeNiveau,
      profil: commande.profil,
    });
    await this.enregistrerParrainage.executer({ membreId: membre.id, matriculeParrain: commande.matriculeParrain });

    await this.enregistrerAudit.executer({
      action: 'membre_cree_par_admin',
      typeEntite: 'Membre',
      acteurId: null,
      metadonnees: { membreId: membre.id, matricule: membre.matricule },
    });
    return membre;
  }
}
