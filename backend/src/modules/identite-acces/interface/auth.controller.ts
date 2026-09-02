import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InscrireUtilisateurUseCase } from '../application/inscrire-utilisateur.use-case';
import { ConnecterUtilisateurUseCase } from '../application/connecter-utilisateur.use-case';
import { InscriptionDto } from './dto/inscription.dto';
import { ConnexionDto } from './dto/connexion.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly inscrireUtilisateur: InscrireUtilisateurUseCase,
    private readonly connecterUtilisateur: ConnecterUtilisateurUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscrire un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé, statut initial "en_attente"' })
  @ApiResponse({ status: 409, description: 'Un compte existe déjà avec ce numéro de téléphone' })
  async sInscrire(@Body() dto: InscriptionDto) {
    const utilisateur = await this.inscrireUtilisateur.executer({
      telephone: dto.phoneNumber,
      email: dto.email,
      motDePasse: dto.password,
    });

    return {
      id: utilisateur.id,
      telephone: utilisateur.telephone,
      email: utilisateur.email,
      statut: utilisateur.statut,
    };
  }

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

    return {
      accessToken,
      utilisateur: {
        id: utilisateur.id,
        telephone: utilisateur.telephone,
        email: utilisateur.email,
        statut: utilisateur.statut,
      },
    };
  }
}
