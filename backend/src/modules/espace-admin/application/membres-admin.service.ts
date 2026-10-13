import { Injectable } from '@nestjs/common';
import { AnnuaireMembresService, FicheMembre } from '../../espace-membre/application/annuaire-membres.service';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { UtilisateurRepositoryPort } from '../../identite-acces/domaine/utilisateur.repository.port';
import { ParrainageMlmRepositoryPort } from '../../reseau-mlm/domaine/parrainage-mlm.repository.port';
import { CommissionMlmRepositoryPort } from '../../reseau-mlm/domaine/commission-mlm.repository.port';
import { AchatPackMlmRepositoryPort } from '../../reseau-mlm/domaine/achat-pack-mlm.repository.port';
import { PackMlmRepositoryPort } from '../../reseau-mlm/domaine/pack-mlm.repository.port';
import { InscriptionRepositoryPort } from '../../formation/domaine/inscription.repository.port';
import { FormationRepositoryPort } from '../../formation/domaine/formation.repository.port';
import { ParticipationActiveService } from '../../tontine/application/participation-active.service';
import { CotisationTontineRepositoryPort } from '../../tontine/domaine/cotisation-tontine.repository.port';
import { ParticipationTontineRepositoryPort } from '../../tontine/domaine/participation-tontine.repository.port';

export type Distinction = 'cotisation' | 'parrainage' | 'formation';

export interface FicheMembreAdmin {
  fiche: FicheMembre;
  titre: string | null;
  prenom: string | null;
  nomDeFamille: string | null;
  email: string | null;
  parrain: FicheMembre | null;
  filleuls: FicheMembre[];
  gainsParrainage: number;
  /** Packs Longrich confirmés + cotisations de tontine payées. */
  totalVerse: number;
  formationsTerminees: string[];
  formationEnCours: string | null;
  prochaineEcheanceTontine: Date | null;
  distinctions: Distinction[];
}

/**
 * La liste des membres de "Gestion des membres" (administrateur) : leur
 * profil, leur parrain et leurs filleuls, ce qu'ils ont versé, leurs
 * formations, leur prochaine échéance de tontine et leurs distinctions.
 *
 * Distinctions (affichées sur la fiche) : "cotisation" = à jour de toutes ses
 * cotisations de tontine ; "parrainage" = a parrainé au moins un membre ce
 * mois-ci ; "formation" = a terminé au moins une formation.
 * Les comptes supprimés n'apparaissent pas.
 */
@Injectable()
export class MembresAdminService {
  constructor(
    private readonly annuaire: AnnuaireMembresService,
    private readonly membres: MembreRepositoryPort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly commissions: CommissionMlmRepositoryPort,
    private readonly achats: AchatPackMlmRepositoryPort,
    private readonly packs: PackMlmRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly formations: FormationRepositoryPort,
    private readonly participationActive: ParticipationActiveService,
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly cotisations: CotisationTontineRepositoryPort,
  ) {}

  async lister(): Promise<FicheMembreAdmin[]> {
    const [annuaire, membres, utilisateurs, packs, formations] = await Promise.all([
      this.annuaire.charger(),
      this.membres.listerTous(),
      this.utilisateurs.listerTous(),
      this.packs.listerTous(),
      this.formations.listerToutes(),
    ]);
    const membreParId = new Map(membres.map((m) => [m.id, m]));
    const emailParId = new Map(utilisateurs.map((u) => [u.id!, u.email ?? null]));
    const prixParPack = new Map(packs.map((p) => [p.id, p.prix]));
    const titreFormation = new Map(formations.map((f) => [f.id!, f.titre]));
    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);
    const maintenant = new Date();

    const fiches: FicheMembreAdmin[] = [];
    for (const fiche of annuaire.values()) {
      if (fiche.statut === 'supprime') {
        continue;
      }
      const membre = membreParId.get(fiche.id);
      const [ancetres, descendants, commissions, achats, inscriptions, actives, participations] = await Promise.all([
        this.parrainages.listerAncetres(fiche.id),
        this.parrainages.listerDescendantsDirects(fiche.id),
        this.commissions.listerParBeneficiaire(fiche.id),
        this.achats.listerParMembreId(fiche.id),
        this.inscriptions.listerParMembreId(fiche.id),
        this.participationActive.lister(fiche.id),
        this.participations.listerParMembre(fiche.id),
      ]);

      let cotisationsVersees = 0;
      for (const participation of participations) {
        cotisationsVersees += (await this.cotisations.listerParParticipation(participation.id!))
          .filter((c) => c.statut === 'payee')
          .reduce((total, c) => total + c.montant, 0);
      }

      let prochaineEcheance: Date | null = null;
      let aJour = actives.length > 0;
      for (const { participation } of actives) {
        const payees = (await this.cotisations.listerParParticipation(participation.id!)).filter((c) => c.statut === 'payee').length;
        if (payees < participation.cotisationsAttendues(maintenant)) {
          aJour = false;
        }
        if (payees < 12) {
          const echeance = participation.echeance(payees + 1);
          if (!prochaineEcheance || echeance < prochaineEcheance) {
            prochaineEcheance = echeance;
          }
        }
      }

      const filleuls = descendants.map((d) => annuaire.get(d.membreId)).filter((f): f is FicheMembre => !!f);
      const formationsTerminees = inscriptions
        .filter((i) => i.statut === 'terminee')
        .map((i) => titreFormation.get(i.formationId) ?? 'Formation');
      const enCours = inscriptions.find((i) => i.statut === 'en_cours');

      const distinctions: Distinction[] = [];
      if (aJour) distinctions.push('cotisation');
      if (filleuls.some((f) => f.membreDepuis && f.membreDepuis >= debutDuMois)) distinctions.push('parrainage');
      if (formationsTerminees.length > 0) distinctions.push('formation');

      fiches.push({
        fiche,
        titre: membre?.profil.titre ?? null,
        prenom: membre?.profil.prenom ?? null,
        nomDeFamille: membre?.profil.nom ?? null,
        email: emailParId.get(fiche.id) ?? null,
        parrain: ancetres[0] ? (annuaire.get(ancetres[0].membreId) ?? null) : null,
        filleuls,
        gainsParrainage: commissions.reduce((total, c) => total + c.montant, 0),
        totalVerse:
          cotisationsVersees +
          achats.filter((a) => a.statut === 'confirme').reduce((total, a) => total + (prixParPack.get(a.packId) ?? 0), 0),
        formationsTerminees,
        formationEnCours: enCours ? (titreFormation.get(enCours.formationId) ?? null) : null,
        prochaineEcheanceTontine: prochaineEcheance,
        distinctions,
      });
    }
    return fiches;
  }
}
