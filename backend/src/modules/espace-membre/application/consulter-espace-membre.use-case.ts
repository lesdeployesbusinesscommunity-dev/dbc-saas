import { Injectable } from '@nestjs/common';
import { AnnuaireMembresService, FicheMembre } from './annuaire-membres.service';
import { ReseauMembre, ReseauMembreService, MlmMembre } from './reseau-membre.service';
import { CoinsMembre, CoinsMembreService } from './coins-membre.service';
import { ActiviteMembre, ActiviteMembreService } from './activite-membre.service';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { ProfilUtilisateur, ProfilUtilisateurService } from '../../identite-acces/application/profil-utilisateur.service';
import { ParticipationActiveService } from '../../tontine/application/participation-active.service';
import { InscriptionAttenteTontineRepositoryPort } from '../../tontine/domaine/inscription-attente-tontine.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface EspaceMembre {
  profil: ProfilUtilisateur;
  moi: FicheMembre | undefined;
  niveaux: { adhesionCode: string | null; actifsCodes: string[]; enAttenteCodes: string[] };
  coins: CoinsMembre;
  reseau: ReseauMembre;
  mlm: MlmMembre;
  activite: ActiviteMembre;
}

/**
 * Tout ce que l'espace membre affiche sur le membre connecté, en un appel :
 * profil, niveaux où il cotise, Coins, réseau, MLM et activité récente. Lecture
 * seule — chaque écriture passe par le module métier concerné (Tontine,
 * Identité & accès...).
 */
@Injectable()
export class ConsulterEspaceMembreUseCase {
  constructor(
    private readonly annuaire: AnnuaireMembresService,
    private readonly reseau: ReseauMembreService,
    private readonly coins: CoinsMembreService,
    private readonly activite: ActiviteMembreService,
    private readonly profil: ProfilUtilisateurService,
    private readonly participationActive: ParticipationActiveService,
    private readonly attente: InscriptionAttenteTontineRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(utilisateur: Utilisateur): Promise<EspaceMembre> {
    const membreId = utilisateur.id!;
    const annuaire = await this.annuaire.charger();
    const [profil, reseau, mlm, coins, actives, enAttente, niveaux] = await Promise.all([
      this.profil.construire(utilisateur),
      this.reseau.reseau(membreId, annuaire),
      this.reseau.mlm(membreId),
      this.coins.consulter(membreId, annuaire),
      this.participationActive.lister(membreId),
      this.attente.listerEnAttentePourMembre(membreId),
      this.niveaux.listerTous(),
    ]);
    const code = (niveauId: number) => niveaux.find((n) => n.id === niveauId)?.code;
    const activite = await this.activite.consulter(membreId, coins.historique);

    return {
      profil,
      moi: annuaire.get(membreId),
      niveaux: {
        adhesionCode: profil.level?.code ?? null,
        actifsCodes: actives.map(({ groupe }) => code(groupe.niveauId)).filter((c): c is string => !!c),
        enAttenteCodes: enAttente.map((i) => code(i.niveauId)).filter((c): c is string => !!c),
      },
      coins,
      reseau,
      mlm,
      activite,
    };
  }
}
