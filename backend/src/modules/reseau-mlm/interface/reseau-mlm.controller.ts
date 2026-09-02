import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AcheterPackUseCase } from '../application/acheter-pack.use-case';
import { ConfirmerAchatPackUseCase } from '../application/confirmer-achat-pack.use-case';
import { PackMlmRepositoryPort } from '../domaine/pack-mlm.repository.port';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { CommissionMlmRepositoryPort } from '../domaine/commission-mlm.repository.port';
import { AcheterPackDto } from './dto/acheter-pack.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';
import { PackMlm } from '../domaine/pack-mlm';

function versReponsePack(pack: PackMlm) {
  return {
    code: pack.code,
    name: pack.nom,
    price: pack.prix,
    pv: pack.pointsPv,
    requiredLevelCode: pack.niveauRequisCode,
    earningsType: pack.typeGains,
  };
}

@ApiTags('reseau-mlm')
@Controller('reseau-mlm')
export class ReseauMlmController {
  constructor(
    private readonly acheterPack: AcheterPackUseCase,
    private readonly confirmerAchat: ConfirmerAchatPackUseCase,
    private readonly packs: PackMlmRepositoryPort,
    private readonly parrainages: ParrainageMlmRepositoryPort,
    private readonly commissions: CommissionMlmRepositoryPort,
  ) {}

  @Get('packs')
  @ApiOperation({ summary: 'Lister le catalogue des packs Longrich' })
  async listerPacks() {
    const tous = await this.packs.listerTous();
    return tous.map(versReponsePack);
  }

  @Post('achats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acheter un pack — initie le paiement' })
  async acheter(@UtilisateurCourant() utilisateur: Utilisateur, @Body() dto: AcheterPackDto) {
    const { achat } = await this.acheterPack.executer({
      membreId: utilisateur.id!,
      telephone: utilisateur.telephone,
      codePack: dto.packCode,
    });
    return { id: achat.id, status: achat.statut, idempotencyKey: achat.cleIdempotencePaiement };
  }

  @Post('achats/:id/confirmer')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Confirmer un achat après paiement complété et calculer les commissions (admin)' })
  async confirmer(@Param('id') id: string) {
    const { achat, commissions } = await this.confirmerAchat.executer({ achatId: id });
    return {
      id: achat.id,
      status: achat.statut,
      commissionsCreated: commissions.map((c) => ({
        beneficiaryMembreId: c.beneficiaireMembreId,
        amount: c.montant,
        depth: c.profondeurNiveau,
      })),
    };
  }

  @Get('mon-reseau')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes filleuls directs' })
  async monReseau(@UtilisateurCourant() utilisateur: Utilisateur) {
    const descendants = await this.parrainages.listerDescendantsDirects(utilisateur.id!);
    return descendants.map((d) => ({ membreId: d.membreId }));
  }

  @Get('mes-commissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes commissions MLM' })
  async mesCommissions(@UtilisateurCourant() utilisateur: Utilisateur) {
    const commissions = await this.commissions.listerParBeneficiaire(utilisateur.id!);
    return commissions.map((c) => ({ amount: c.montant, depth: c.profondeurNiveau, status: c.statut }));
  }
}
