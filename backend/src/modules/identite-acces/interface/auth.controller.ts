import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConnecterUtilisateurUseCase } from '../application/connecter-utilisateur.use-case';
import { VerifierOtpConnexionUseCase } from '../application/verifier-otp-connexion.use-case';
import { BasculerDoubleAuthentificationUseCase } from '../application/basculer-double-authentification.use-case';
import { ChangerMotDePasseUseCase } from '../application/changer-mot-de-passe.use-case';
import { ProfilUtilisateurService } from '../application/profil-utilisateur.service';
import { MettreAJourProfilUseCase } from '../application/mettre-a-jour-profil.use-case';
import { SecretDoubleAuthentificationRepositoryPort } from '../domaine/secret-double-authentification.repository.port';
import { ConnexionDto } from './dto/connexion.dto';
import { VerifierOtpDto } from './dto/verifier-otp.dto';
import { ChangerMotDePasseDto } from './dto/changer-mot-de-passe.dto';
import { MettreAJourProfilDto } from './dto/mettre-a-jour-profil.dto';
import { Utilisateur } from '../domaine/utilisateur';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UtilisateurCourant } from './utilisateur-courant.decorator';

// Pas d'auto-inscription en libre-service : un visiteur soumet une demande
// (POST /demandes-inscription), un admin la valide et crée le compte — voir
// DemandesInscriptionController. Ce compte sert ensuite à se connecter ici,
// avec son matricule (écran de connexion) ou son numéro de téléphone.

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly connecterUtilisateur: ConnecterUtilisateurUseCase,
    private readonly verifierOtp: VerifierOtpConnexionUseCase,
    private readonly basculerDoubleAuth: BasculerDoubleAuthentificationUseCase,
    private readonly changerMotDePasse: ChangerMotDePasseUseCase,
    private readonly profil: ProfilUtilisateurService,
    private readonly mettreAJourProfil: MettreAJourProfilUseCase,
    private readonly secrets2fa: SecretDoubleAuthentificationRepositoryPort,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: "Authentifier un utilisateur (matricule ou téléphone) et obtenir un jeton d'accès" })
  @ApiResponse({ status: 200, description: 'Authentification réussie, ou défi OTP à compléter si la 2FA est active' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou compte suspendu' })
  async seConnecter(@Body() dto: ConnexionDto) {
    const resultat = await this.connecterUtilisateur.executer({
      matricule: dto.membershipNumber,
      telephone: dto.phoneNumber,
      motDePasse: dto.password,
    });

    if (resultat.requiertOtp) {
      return { otpRequired: true, otpChallengeId: resultat.defiOtpId };
    }

    return { accessToken: resultat.accessToken, user: await this.profil.construire(resultat.utilisateur) };
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

    return { accessToken, user: await this.profil.construire(utilisateur) };
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Renouveler le jeton d'accès d'une session active (appelé périodiquement par l'interface)" })
  async renouveler(@UtilisateurCourant() utilisateur: Utilisateur) {
    return { accessToken: await this.profil.emettreJeton(utilisateur) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Profil de l'utilisateur authentifié" })
  @ApiResponse({ status: 200, description: 'Profil renvoyé' })
  @ApiResponse({ status: 401, description: 'Jeton absent, invalide ou expiré' })
  async monProfil(@UtilisateurCourant() utilisateur: Utilisateur) {
    const secret = await this.secrets2fa.trouverParUtilisateurId(utilisateur.id!);
    return { ...(await this.profil.construire(utilisateur)), twoFactorEnabled: secret?.actif ?? false };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier mon profil (nom, coordonnées, ville, profession, photo)' })
  async modifierMonProfil(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: MettreAJourProfilDto) {
    await this.mettreAJourProfil.executer({
      utilisateur,
      email: dto.email,
      telephone: dto.phoneNumber,
      profil: {
        prenom: dto.firstName,
        nom: dto.lastName,
        ville: dto.city,
        pays: dto.country,
        profession: dto.profession,
        photoUrl: dto.photoUrl,
      },
    });
    return this.monProfil(utilisateur);
  }

  @Post('password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer mon mot de passe (l’actuel est exigé)' })
  async changerMonMotDePasse(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: ChangerMotDePasseDto) {
    await this.changerMotDePasse.executer({
      utilisateur,
      motDePasseActuel: dto.currentPassword,
      nouveauMotDePasse: dto.newPassword,
    });
    return { changed: true };
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
