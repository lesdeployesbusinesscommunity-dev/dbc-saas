import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConnecterUtilisateurUseCase } from '../application/connecter-utilisateur.use-case';
import { VerifierOtpConnexionUseCase } from '../application/verifier-otp-connexion.use-case';
import { BasculerDoubleAuthentificationUseCase } from '../application/basculer-double-authentification.use-case';
import { ConnexionDto } from './dto/connexion.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
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
  constructor(
    private readonly connecterUtilisateur: ConnecterUtilisateurUseCase,
    private readonly verifierOtp: VerifierOtpConnexionUseCase,
    private readonly basculerDoubleAuth: BasculerDoubleAuthentificationUseCase,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: "Authentifier un utilisateur et obtenir un jeton d'accès" })
  @ApiResponse({ status: 200, description: 'Authentification réussie, ou défi OTP à compléter si la 2FA est active' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou compte suspendu' })
  async seConnecter(@Body() dto: ConnexionDto) {
    const resultat = await this.connecterUtilisateur.executer({
      telephone: dto.phoneNumber,
      motDePasse: dto.password,
    });

    if (resultat.requiertOtp) {
      return { otpRequired: true, otpChallengeId: resultat.defiOtpId };
    }

    return { accessToken: resultat.accessToken, utilisateur: versReponseUtilisateur(resultat.utilisateur) };
  }

  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Compléter la connexion avec le code OTP reçu par WhatsApp' })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  @ApiResponse({ status: 401, description: 'Code invalide, expiré ou trop de tentatives' })
  async completerConnexion(@Body() dto: VerifierOtpDto) {
    const { accessToken, utilisateur } = await this.verifierOtp.executer({
      defiOtpId: dto.otpChallengeId,
      code: dto.code,
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

  @Post('2fa/enable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer la double authentification (OTP WhatsApp au prochain login)' })
  async activerDoubleAuth(@UtilisateurCourant() utilisateur: Utilisateur) {
    const secret = await this.basculerDoubleAuth.executer(utilisateur.id!, true);
    return { twoFactorEnabled: secret.actif };
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactiver la double authentification' })
  async desactiverDoubleAuth(@UtilisateurCourant() utilisateur: Utilisateur) {
    const secret = await this.basculerDoubleAuth.executer(utilisateur.id!, false);
    return { twoFactorEnabled: secret.actif };
  }
}
