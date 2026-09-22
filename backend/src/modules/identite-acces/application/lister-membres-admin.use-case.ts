import { Injectable } from '@nestjs/common';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface MembreAdmin {
  id: string;
  membershipNumber: string;
  firstName: string | undefined;
  lastName: string | undefined;
  phoneNumber: string;
  email: string | undefined;
  country: string | undefined;
  status: string;
  level: { id: number; code: string; name: string } | undefined;
}

/**
 * Vue de lecture pour le back-office (liste des membres validés). Ni Membre
 * (Adhésion) ni Utilisateur (Identité & accès) ne stockent nom/prénom/pays :
 * ces informations viennent de la DemandeInscription liée (utilisateurId),
 * seule trace de ces données déclarées à l'inscription — voir
 * ValiderDemandeInscriptionUseCase.
 */
@Injectable()
export class ListerMembresAdminUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly demandes: DemandeInscriptionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(): Promise<MembreAdmin[]> {
    const [tousMembres, toutesDemandes, tousNiveaux] = await Promise.all([
      this.membres.listerTous(),
      this.demandes.listerToutes(),
      this.niveaux.listerTous(),
    ]);

    const demandeParUtilisateurId = new Map(
      toutesDemandes.filter((d) => d.utilisateurId !== undefined).map((d) => [d.utilisateurId!, d]),
    );
    const niveauParId = new Map(tousNiveaux.map((n) => [n.id, n]));

    const utilisateursTrouves = await Promise.all(tousMembres.map((m) => this.utilisateurs.trouverParId(m.id)));

    return tousMembres.map((membre, index) => {
      const utilisateur = utilisateursTrouves[index];
      const demande = demandeParUtilisateurId.get(membre.id);
      const niveau = niveauParId.get(membre.niveauActuelId);

      return {
        id: membre.id,
        membershipNumber: membre.matricule,
        firstName: demande?.prenom,
        lastName: demande?.nom,
        phoneNumber: utilisateur?.telephone ?? demande?.telephone ?? '',
        email: utilisateur?.email,
        country: demande?.pays,
        status: membre.statut,
        level: niveau ? { id: niveau.id, code: niveau.code, name: niveau.nom } : undefined,
      };
    });
  }
}
