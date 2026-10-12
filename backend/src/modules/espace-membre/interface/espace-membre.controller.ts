import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsulterEspaceMembreUseCase } from '../application/consulter-espace-membre.use-case';
import { FicheMembre } from '../application/annuaire-membres.service';
import { NoeudReseau } from '../application/reseau-membre.service';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';

function versReponseFiche(fiche: FicheMembre) {
  return {
    id: fiche.id,
    name: fiche.nom,
    membershipNumber: fiche.matricule,
    levelCode: fiche.niveauCode,
    profession: fiche.profession,
    city: fiche.ville,
    country: fiche.pays,
    photoUrl: fiche.photoUrl,
    coins: fiche.coins,
    status: fiche.statut,
    memberSince: fiche.membreDepuis,
    phoneNumber: fiche.telephone,
    isAdmin: fiche.estAdmin,
  };
}

function versReponseNoeud(noeud: NoeudReseau): unknown {
  return {
    member: versReponseFiche(noeud.membre),
    relation: noeud.relation,
    depth: noeud.profondeur,
    parentName: noeud.parrainNom,
    children: noeud.enfants.map(versReponseNoeud),
  };
}

@ApiTags('espace-membre')
@Controller('espace-membre')
export class EspaceMembreController {
  constructor(private readonly consulterEspaceMembre: ConsulterEspaceMembreUseCase) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Tout l'espace membre en un appel : profil, niveaux, Coins, réseau, MLM, activité récente",
  })
  async consulter(@UtilisateurCourant() utilisateur: Utilisateur) {
    const espace = await this.consulterEspaceMembre.executer(utilisateur);
    const commissionDe = (membreId: string) => espace.mlm.commissionParFilleul.get(membreId) ?? 0;
    const aPlat = (noeuds: NoeudReseau[]): NoeudReseau[] => noeuds.flatMap((n) => [n, ...aPlat(n.enfants)]);

    return {
      profile: {
        ...espace.profil,
        coins: espace.coins.solde,
        sponsoredCount: espace.reseau.filleulsDirects,
        referralEarnings: espace.mlm.commissionsTotales,
      },
      levels: {
        membershipLevelCode: espace.niveaux.adhesionCode,
        activeLevelCodes: espace.niveaux.actifsCodes,
        waitingLevelCodes: espace.niveaux.enAttenteCodes,
      },
      coins: {
        balance: espace.coins.solde,
        history: espace.coins.historique.map((m) => ({
          id: m.id,
          at: m.date,
          amount: m.montant,
          category: m.categorie,
          reason: m.motif,
          label: m.libelle,
        })),
        leaderboard: espace.coins.classement.map((ligne) => ({
          ...versReponseFiche(ligne.membre),
          coinsThisMonth: ligne.coinsDuMois,
          isMe: ligne.membre.id === utilisateur.id,
        })),
        earningRules: {
          actions: espace.coins.bareme.actions.map((a) => ({ code: a.code, coins: a.coins, category: a.categorie })),
          levels: espace.coins.bareme.niveaux.map((n) => ({ levelCode: n.niveauCode, coinsPerMonth: n.coinsParMois })),
        },
      },
      network: {
        sponsorChain: espace.reseau.parrains.map((p) => ({ member: versReponseFiche(p.membre), relation: p.relation })),
        tree: espace.reseau.arbre.map(versReponseNoeud),
        alerts: espace.reseau.alertes.map((a) => ({
          id: `alert-${a.membre.id}`,
          member: versReponseFiche(a.membre),
          kind: a.type,
          days: a.jours,
        })),
        directReferrals: espace.reseau.filleulsDirects,
        totalNetwork: espace.reseau.totalReseau,
        depth: espace.reseau.profondeurMax,
      },
      mlm: {
        pack: espace.mlm.pack
          ? {
              name: espace.mlm.pack.nom,
              price: espace.mlm.pack.prix,
              pv: espace.mlm.pack.pv,
              requiredLevelCode: espace.mlm.pack.niveauRequisCode,
            }
          : null,
        personalVolume: espace.mlm.volumePersonnel,
        monthlyCommissions: espace.mlm.commissionsDuMois,
        totalCommissions: espace.mlm.commissionsTotales,
        network: aPlat(espace.reseau.arbre).map((noeud) => ({
          memberId: noeud.membre.id,
          name: noeud.membre.nom,
          type: noeud.relation,
          levelCode: noeud.membre.niveauCode,
          commission: commissionDe(noeud.membre.id),
        })),
      },
      activity: {
        recent: espace.activite.recentes.map((a) => ({ id: a.id, kind: a.type, at: a.date, name: a.nom })),
        monthlyCoinsByCategory: espace.activite.coinsDuMoisParCategorie,
        monthlyNames: espace.activite.nomsDuMois,
        badges: espace.activite.badges,
      },
    };
  }
}
