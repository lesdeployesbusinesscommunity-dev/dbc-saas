import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreerDemandeInscriptionUseCase } from '../application/creer-demande-inscription.use-case';
import { ValiderDemandeInscriptionUseCase } from '../application/valider-demande-inscription.use-case';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { CreerDemandeInscriptionDto } from './dto/creer-demande-inscription.dto';
import { ValiderDemandeInscriptionDto } from './dto/valider-demande-inscription.dto';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';
import { DemandeInscription } from '../domaine/demande-inscription';

function versReponseDemande(demande: DemandeInscription) {
  return {
    id: demande.id,
    lastName: demande.nom,
    firstName: demande.prenom,
    age: demande.age,
    country: demande.pays,
    phoneNumber: demande.telephone,
    sponsorCode: demande.codeParrain,
    desiredLevelCode: demande.niveauSouhaiteCode,
    status: demande.statut,
  };
}

@ApiTags('demandes-inscription')
@Controller('demandes-inscription')
export class DemandesInscriptionController {
  constructor(
    private readonly creerDemande: CreerDemandeInscriptionUseCase,
    private readonly validerDemande: ValiderDemandeInscriptionUseCase,
    private readonly demandes: DemandeInscriptionRepositoryPort,
  ) {}

  @Post()
  @ApiOperation({ summary: "Soumettre une demande d'adhésion (visiteur)" })
  @ApiResponse({ status: 201, description: 'Demande enregistrée, en attente de validation admin' })
  async soumettre(@Body() dto: CreerDemandeInscriptionDto) {
    const demande = await this.creerDemande.executer({
      nom: dto.lastName,
      prenom: dto.firstName,
      age: dto.age,
      pays: dto.country,
      telephone: dto.phoneNumber,
      codeParrain: dto.sponsorCode,
      niveauSouhaiteCode: dto.desiredLevelCode,
    });
    return versReponseDemande(demande);
  }

  @Get()
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Lister les demandes en attente (admin)' })
  async listerEnAttente() {
    const demandes = await this.demandes.listerEnAttente();
    return demandes.map(versReponseDemande);
  }

  @Post(':id/valider')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Valider une demande : crée le compte et le membre (admin)' })
  @ApiResponse({ status: 201, description: 'Compte et membre créés' })
  async valider(@Param('id') id: string, @Body() dto: ValiderDemandeInscriptionDto) {
    const { utilisateur, membre } = await this.validerDemande.executer({
      demandeId: id,
      motDePasseTemporaire: dto.temporaryPassword,
    });
    return {
      userId: utilisateur.id,
      phoneNumber: utilisateur.telephone,
      membershipNumber: membre.matricule,
      currentLevelId: membre.niveauActuelId,
    };
  }
}
