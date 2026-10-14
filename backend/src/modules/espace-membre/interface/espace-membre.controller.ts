import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsObject } from 'class-validator';
import { PreferencesMembreService } from '../application/preferences-membre.service';
import { ConsulterEspaceMembreUseCase } from '../application/consulter-espace-membre.use-case';
import { FicheMembre } from '../application/annuaire-membres.service';
import { NoeudReseau } from '../application/reseau-membre.service';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';

class EnregistrerPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  notificationsEnabled: boolean;

  @ApiProperty({ example: { cotisation: { email: true, whatsapp: true } } })
  @IsObject()
  notifications: Record<string, unknown>;

  @ApiProperty({ example: { showInLeaderboard: true, showCv: true, showWhatsapp: false, showCity: true } })
  @IsObject()
  privacy: Record<string, unknown>;
}

/**
 * Fiche d'un membre telle que "moiId" peut la voir : ce que ce membre a
 * caché aux autres (Paramètres > Confidentialité) n'est pas envoyé. Sans
 * fiche "CV" visible, ni profession ni contacts.
 */
function versReponseFiche(fiche: FicheMembre, moiId?: string) {
  const { showCv, showWhatsapp, showCity } = fiche.confidentialite;
  const autre = fiche.id !== moiId;
  return {
    id: fiche.id,
    name: fiche.nom,
    membershipNumber: fiche.matricule,
    levelCode: fiche.niveauCode,
    profession: autre && !showCv ? null : fiche.profession,
    city: autre && (!showCv || !showCity) ? null : fiche.ville,
    country: fiche.pays,
    photoUrl: fiche.photoUrl,
    coins: fiche.coins,
    status: fiche.statut,
    memberSince: fiche.membreDepuis,
    phoneNumber: autre && (!showCv || !showWhatsapp) ? null : fiche.telephone,
    cvVisible: !autre || showCv,
    isAdmin: fiche.estAdmin,
  };
}

function versReponseNoeud(noeud: NoeudReseau, moiId: string): unknown {
  return {
    member: versReponseFiche(noeud.membre, moiId),
    relation: noeud.relation,
    depth: noeud.profondeur,
    parentName: noeud.parrainNom,
    children: noeud.enfants.map((enfant) => versReponseNoeud(enfant, moiId)),
  };
}

@ApiTags('espace-membre')
@Controller('espace-membre')
export class EspaceMembreController {
  constructor(
    private readonly consulterEspaceMembre: ConsulterEspaceMembreUseCase,
    private readonly preferences: PreferencesMembreService,
  ) {}

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
        // Un membre qui ne veut pas apparaître dans le classement n'y est que pour lui-même.
        leaderboard: espace.coins.classement
          .filter((ligne) => ligne.membre.id === utilisateur.id || ligne.membre.confidentialite.showInLeaderboard)
          .map((ligne) => ({
            ...versReponseFiche(ligne.membre, utilisateur.id),
            coinsThisMonth: ligne.coinsDuMois,
            isMe: ligne.membre.id === utilisateur.id,
          })),
        earningRules: {
          actions: espace.coins.bareme.actions.map((a) => ({ code: a.code, coins: a.coins, category: a.categorie })),
          levels: espace.coins.bareme.niveaux.map((n) => ({ levelCode: n.niveauCode, coinsPerMonth: n.coinsParMois })),
        },
      },
      network: {
        sponsorChain: espace.reseau.parrains.map((p) => ({
          member: versReponseFiche(p.membre, utilisateur.id),
          relation: p.relation,
        })),
        tree: espace.reseau.arbre.map((noeud) => versReponseNoeud(noeud, utilisateur.id!)),
        alerts: espace.reseau.alertes.map((a) => ({
          id: `alert-${a.membre.id}`,
          member: versReponseFiche(a.membre, utilisateur.id),
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

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes préférences : notifications et confidentialité' })
  async mesPreferences(@UtilisateurCourant() utilisateur: Utilisateur) {
    return this.preferences.lire(utilisateur.id!);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer mes préférences : notifications et confidentialité' })
  async enregistrerMesPreferences(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: EnregistrerPreferencesDto) {
    return this.preferences.enregistrer(utilisateur.id!, dto);
  }
}
