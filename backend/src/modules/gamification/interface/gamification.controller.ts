import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AttribuerCoinsManuellementUseCase } from '../application/attribuer-coins-manuellement.use-case';
import { TransactionCoinsRepositoryPort } from '../domaine/transaction-coins.repository.port';
import { AttribuerCoinsDto } from './dto/attribuer-coins.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly attribuerCoins: AttribuerCoinsManuellementUseCase,
    private readonly transactions: TransactionCoinsRepositoryPort,
  ) {}

  @Get('mon-solde')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon solde de DBC Coins et mon historique' })
  async monSolde(@UtilisateurCourant() utilisateur: Utilisateur) {
    const [solde, historique] = await Promise.all([
      this.transactions.dernierSolde(utilisateur.id!),
      this.transactions.listerParMembre(utilisateur.id!),
    ]);
    return {
      balance: solde,
      history: historique.map((t) => ({ delta: t.delta, balanceAfter: t.soldeApres, reason: t.motif })),
    };
  }

  @Get('classement')
  @ApiOperation({ summary: 'Classement des membres par solde de coins' })
  @ApiQuery({ name: 'limit', required: false })
  async classement(@Query('limit') limite?: string) {
    const lignes = await this.transactions.classement(limite ? parseInt(limite, 10) : 20);
    return lignes.map((l) => ({ membreId: l.membreId, balance: l.solde }));
  }

  @Post('attribuer')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Attribuer ou retirer des coins manuellement (admin)' })
  async attribuer(@Body() dto: AttribuerCoinsDto) {
    const transaction = await this.attribuerCoins.executer({
      membreId: dto.membreId,
      delta: dto.amount,
      motif: dto.reason,
    });
    return { balanceAfter: transaction.soldeApres };
  }
}
