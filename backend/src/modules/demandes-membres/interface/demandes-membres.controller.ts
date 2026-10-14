import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { DemandesMembresUseCase, PREFIXE_DECISION } from '../application/demandes-membres.use-case';
import { DemandeMembre, TYPES_DEMANDE, TypeDemande } from '../domaine/demande-membre';
import { AudienceNotification } from '../domaine/lecture-notification.repository.port';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

class DeposerDemandeDto {
  @ApiProperty({ enum: TYPES_DEMANDE })
  @IsIn(TYPES_DEMANDE)
  type: TypeDemande;

  @ApiPropertyOptional({ example: { levelKey: 'performer' }, description: 'Précisions propres au type de demande' })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

class RetirerDemandeDto {
  @ApiProperty({ enum: TYPES_DEMANDE })
  @IsIn(TYPES_DEMANDE)
  type: TypeDemande;
}

class DeciderDemandeDto {
  @ApiProperty({ enum: ['validated', 'refused'] })
  @IsIn(['validated', 'refused'])
  status: 'validated' | 'refused';
}

class MarquerLuesDto {
  @ApiProperty({ enum: ['membre', 'admin'] })
  @IsIn(['membre', 'admin'])
  audience: AudienceNotification;

  @ApiProperty({ type: [String], description: 'Identifiants des notifications lues' })
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];
}

function versReponseDemande(demande: DemandeMembre) {
  return {
    id: demande.id,
    decisionId: `${PREFIXE_DECISION}${demande.id}`,
    type: demande.type,
    status: demande.statut,
    details: demande.details,
    member: demande.profil,
    createdAt: demande.creeLe,
    decidedAt: demande.decideLe,
    readByAdmin: demande.lueParAdmin,
    decisionReadByMember: demande.decisionLueParMembre,
  };
}

/**
 * Notifications ENREGISTRÉES des deux espaces : les demandes des membres et
 * les décisions de l'administration, plus l'état "lu" des notifications
 * déduites. Les autres notifications se calculent côté interface.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class DemandesMembresController {
  constructor(private readonly demandes: DemandesMembresUseCase) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Demandes (toutes pour un administrateur, les siennes pour un membre) et notifications déjà lues',
  })
  async consulter(@UtilisateurCourant() utilisateur: Utilisateur) {
    const { demandes, lues } = await this.demandes.consulter(utilisateur);
    return { requests: demandes.map(versReponseDemande), readIds: lues };
  }

  @Post('demandes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Envoyer une demande à l’administration (Membre)' })
  async deposer(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: DeposerDemandeDto) {
    return versReponseDemande(await this.demandes.deposer(utilisateur, dto.type, dto.details ?? {}));
  }

  @Post('demandes/retirer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retirer sa demande en attente de ce type (Membre)' })
  async retirer(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: RetirerDemandeDto) {
    await this.demandes.retirer(utilisateur, dto.type);
    return { withdrawn: true };
  }

  @Post('demandes/:id/decision')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiOperation({ summary: 'Valider ou refuser une demande ; le membre en est prévenu (Administrateur)' })
  async decider(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DeciderDemandeDto) {
    return versReponseDemande(await this.demandes.decider(id, dto.status));
  }

  @Post('lues')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Marquer des notifications comme lues' })
  async marquerLues(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: MarquerLuesDto) {
    await this.demandes.marquerLues(utilisateur, dto.audience, dto.ids);
    return { read: dto.ids.length };
  }
}
