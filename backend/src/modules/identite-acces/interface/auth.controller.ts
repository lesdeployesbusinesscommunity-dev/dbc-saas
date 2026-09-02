import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConnecterUtilisateurUseCase } from '../application/connecter-utilisateur.use-case';
import { ConnexionDto } from './dto/connexion.dto';
import { Utilisateur } from '../domaine/utilisateur';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UtilisateurCourant } from './utilisateur-courant.decorator';

function versReponseUtilisateur(utilisateur: Utilisateur) {
  return {
    id: utilisateur.id,
    telephone: utilisateur.telephone,
    email: utilisateur.email,
    statut: utilisateur.statut,
  };
}

// Pas d'auto-inscription en libre-service : un visiteur soumet une demande
// (POST /demandes-inscription), un admin la valide et crée le compte — voir
// DemandesInscriptionController. Ce compte sert ensuite à se connecter ici.

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly connecterUtilisateur: ConnecterUtilisateurUseCase) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: "Authentifier un utilisateur et obtenir un jeton d'accès" })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou compte suspendu' })
  async seConnecter(@Body() dto: ConnexionDto) {
    const { accessToken, utilisateur } = await this.connecterUtilisateur.executer({
      telephone: dto.phoneNumber,
      motDePasse: dto.password,
    });

    return { accessToken, utilisateur: versReponseUtilisateur(utilisateur) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Profil de l'utilisateur authentifié" })
  @ApiResponse({ status: 200, description: 'Profil renvoyé' })
  @ApiResponse({ status: 401, description: 'Jeton absent, invalide ou expiré' })
  async monProfil(@UtilisateurCourant() utilisateur: Utilisateur) {
    return versReponseUtilisateur(utilisateur);
  }
}
