import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NiveauAdhesionRepositoryPort } from '../domaine/niveau-adhesion.repository.port';
import { MembreRepositoryPort } from '../domaine/membre.repository.port';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { NiveauAdhesion } from '../domaine/niveau-adhesion';
import { Membre } from '../domaine/membre';

function versReponseNiveau(niveau: NiveauAdhesion) {
  return {
    code: niveau.code,
    name: niveau.nom,
    monthlyDue: niveau.cotisationMensuelle,
    payout: niveau.montantCagnotte,
    referralCommission: niveau.commissionParrainage,
    coinsPerMonth: niveau.coinsParMois,
    perks: niveau.listeAvantages(),
  };
}

function versReponseMembre(membre: Membre) {
  return {
    id: membre.id,
    membershipNumber: membre.matricule,
    status: membre.statut,
    currentLevelId: membre.niveauActuelId,
  };
}

@ApiTags('adhesion')
@Controller('adhesion')
export class AdhesionController {
  constructor(
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly membres: MembreRepositoryPort,
  ) {}

  @Get('niveaux')
  @ApiOperation({ summary: "Lister le catalogue des niveaux d'adhésion" })
  async listerNiveaux() {
    const tous = await this.niveaux.listerTous();
    return tous.map(versReponseNiveau);
  }

  @Get('moi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tableau de bord du membre connecté' })
  @ApiResponse({ status: 404, description: "Aucun niveau choisi pour l'instant" })
  async monTableauDeBord(@UtilisateurCourant() utilisateur: Utilisateur) {
    const membre = await this.membres.trouverParId(utilisateur.id!);
    if (!membre) {
      throw new NotFoundException("Aucun niveau d'adhésion choisi pour l'instant");
    }
    return versReponseMembre(membre);
  }
}
