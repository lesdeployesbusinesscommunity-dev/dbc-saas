import { Injectable } from '@nestjs/common';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { ParrainageMlmRepositoryPort } from '../../reseau-mlm/domaine/parrainage-mlm.repository.port';
import { CommissionMlmRepositoryPort } from '../../reseau-mlm/domaine/commission-mlm.repository.port';
import { AchatPackMlmRepositoryPort } from '../../reseau-mlm/domaine/achat-pack-mlm.repository.port';
import { PackMlmRepositoryPort } from '../../reseau-mlm/domaine/pack-mlm.repository.port';
import { InscriptionRepositoryPort } from '../../formation/domaine/inscription.repository.port';
import { FormationRepositoryPort } from '../../formation/domaine/formation.repository.port';

export interface MembreAdmin {
  id: string;
  membershipNumber: string;
  firstName: string | undefined;
  lastName: string | undefined;
  phoneNumber: string;
  email: string | undefined;
  country: string | undefined;
  city: string | undefined;
  profession: string | undefined;
  status: string;
  level: { id: number; code: string; name: string } | undefined;
  joinedAt: Date | undefined;
  sponsorName: string | undefined;
  sponsorMembershipNumber: string | undefined;
  referralEarnings: number;
  contributed: number;
  trainingsCompleted: string[];
  trainingInProgress: string | undefined;
  sponsoredMembers: { name: string; membershipNumber: string; city: string | undefined }[];
}

/**
 * Vue de lecture pour le back-office (liste des membres validés). Ni Membre
 * (Adhésion) ni Utilisateur (Identité & accès) ne stockent nom/prénom/pays/
 * ville/profession : ces informations viennent de la DemandeInscription liée
 * (utilisateurId), seule trace de ces données déclarées à l'inscription —
 * voir ValiderDemandeInscriptionUseCase.
 *
 * Le reste (parrain, gains de parrainage, montant investi dans des packs,
 * formations suivies) est agrégé depuis Réseau MLM et Formation plutôt que
 * stocké ici — voir mémoire "project_frontend_backend_ecart_admin" pour
 * l'historique de cette décision (pas de champ inventé côté UI admin).
 * "contributed" ne couvre que les achats de pack MLM confirmés : les
 * cotisations Tontine ne sont pas encore reliées au module Paiements (voir
 * mémoire "Tontine : ambiguïté cycles").
 */
@Injectable()
export class ListerMembresAdminUseCase {
  constructor(
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly demandes: DemandeInscriptionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly commissions: CommissionMlmRepositoryPort,
    private readonly achats: AchatPackMlmRepositoryPort,
    private readonly packs: PackMlmRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly formations: FormationRepositoryPort,
  ) {}

  async executer(): Promise<MembreAdmin[]> {
    const [tousMembres, toutesDemandes, tousNiveaux, tousPacks, toutesFormations] = await Promise.all([
      this.membres.listerTous(),
      this.demandes.listerToutes(),
      this.niveaux.listerTous(),
      this.packs.listerTous(),
      this.formations.listerToutes(),
    ]);

    // Membre.id === Utilisateur.id === DemandeInscription.utilisateurId (voir Membre) :
    // cette map sert donc aussi bien à retrouver la demande d'un membre que celle d'un
    // ancêtre dans l'arbre de parrainage (sponsorDemande ci-dessous).
    const demandeParUtilisateurId = new Map(
      toutesDemandes.filter((d) => d.utilisateurId !== undefined).map((d) => [d.utilisateurId!, d]),
    );
    const niveauParId = new Map(tousNiveaux.map((n) => [n.id, n]));
    const membreParId = new Map(tousMembres.map((m) => [m.id, m]));
    const prixParPackId = new Map(tousPacks.map((p) => [p.id, p.prix]));
    const titreParFormationId = new Map(toutesFormations.map((f) => [f.id, f.titre]));

    const utilisateursTrouves = await Promise.all(tousMembres.map((m) => this.utilisateurs.trouverParId(m.id)));

    return Promise.all(
      tousMembres.map(async (membre, index) => {
        const utilisateur = utilisateursTrouves[index];
        const demande = demandeParUtilisateurId.get(membre.id);
        const niveau = niveauParId.get(membre.niveauActuelId);

        const [ancetres, descendantsDirects, commissionsRecues, achatsDuMembre, inscriptionsDuMembre] =
          await Promise.all([
            this.parrainages.listerAncetres(membre.id),
            this.parrainages.listerDescendantsDirects(membre.id),
            this.commissions.listerParBeneficiaire(membre.id),
            this.achats.listerParMembreId(membre.id),
            this.inscriptions.listerParMembreId(membre.id),
          ]);

        // ancetres[0] = parent direct dans l'arbre de parrainage (voir
        // ParrainageMlmRepositoryPort.listerAncetres : "du plus proche au plus lointain").
        const sponsor = ancetres[0] ? membreParId.get(ancetres[0].membreId) : undefined;
        const sponsorDemande = sponsor ? demandeParUtilisateurId.get(sponsor.id) : undefined;

        const sponsoredMembers = descendantsDirects
          .map((descendant) => {
            const filleul = membreParId.get(descendant.membreId);
            const filleulDemande = filleul ? demandeParUtilisateurId.get(filleul.id) : undefined;
            if (!filleul || !filleulDemande) return null;
            return {
              name: `${filleulDemande.prenom} ${filleulDemande.nom}`,
              membershipNumber: filleul.matricule,
              city: filleulDemande.ville,
            };
          })
          .filter((entry) => entry !== null);

        const contributed = achatsDuMembre
          .filter((achat) => achat.statut === 'confirme')
          .reduce((total, achat) => total + (prixParPackId.get(achat.packId) ?? 0), 0);

        const referralEarnings = commissionsRecues.reduce((total, commission) => total + commission.montant, 0);

        const trainingsCompleted = inscriptionsDuMembre
          .filter((inscription) => inscription.statut === 'terminee')
          .map((inscription) => titreParFormationId.get(inscription.formationId) ?? inscription.formationId);
        const enCours = inscriptionsDuMembre.find((inscription) => inscription.statut === 'en_cours');
        const trainingInProgress = enCours
          ? (titreParFormationId.get(enCours.formationId) ?? enCours.formationId)
          : undefined;

        return {
          id: membre.id,
          membershipNumber: membre.matricule,
          firstName: demande?.prenom,
          lastName: demande?.nom,
          phoneNumber: utilisateur?.telephone ?? demande?.telephone ?? '',
          email: utilisateur?.email,
          country: demande?.pays,
          city: demande?.ville,
          profession: demande?.profession,
          status: membre.statut,
          level: niveau ? { id: niveau.id, code: niveau.code, name: niveau.nom } : undefined,
          joinedAt: demande?.creeLe,
          sponsorName: sponsorDemande ? `${sponsorDemande.prenom} ${sponsorDemande.nom}` : undefined,
          sponsorMembershipNumber: sponsor?.matricule,
          referralEarnings,
          contributed,
          trainingsCompleted,
          trainingInProgress,
          sponsoredMembers,
        };
      }),
    );
  }
}
