import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitierPaiementUseCase } from '../application/initier-paiement.use-case';
import { RecevoirCallbackPaiementUseCase } from '../application/recevoir-callback-paiement.use-case';
import { InitierPaiementDto } from './dto/initier-paiement.dto';
import { CallbackPaiementDto } from './dto/callback-paiement.dto';
import { Paiement } from '../domaine/paiement';
import { WebhookSecretGuard } from './webhook-secret.guard';

function versReponsePaiement(paiement: Paiement) {
  return {
    id: paiement.id,
    amount: paiement.montant,
    purpose: paiement.objet,
    status: paiement.statut,
  };
}

@ApiTags('paiements')
@Controller('paiements')
export class PaiementsController {
  constructor(
    private readonly initierPaiement: InitierPaiementUseCase,
    private readonly recevoirCallback: RecevoirCallbackPaiementUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Initier un paiement Mobile Money' })
  @ApiResponse({ status: 201, description: 'Paiement créé, statut "en_attente"' })
  async initier(@Body() dto: InitierPaiementDto) {
    const paiement = await this.initierPaiement.executer({
      montant: dto.amount,
      objet: dto.purpose,
      telephone: dto.phoneNumber,
      cleIdempotence: dto.idempotencyKey,
    });
    return versReponsePaiement(paiement);
  }

  @Post('webhook')
  @UseGuards(WebhookSecretGuard)
  @ApiExcludeEndpoint() // appelé par le fournisseur Mobile Money, pas par le frontend
  async webhook(@Body() dto: CallbackPaiementDto) {
    const paiement = await this.recevoirCallback.executer({
      cleIdempotence: dto.idempotencyKey,
      reussi: dto.success,
    });
    return versReponsePaiement(paiement);
  }
}
