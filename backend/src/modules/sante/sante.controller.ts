import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint de vérification de vie — ne dépend d'aucune ressource externe
 * (ni base de données, ni cache) afin de garantir que le déploiement réussit
 * même avant que ces briques ne soient connectées.
 */
@Controller('health')
export class SanteController {
  @Get()
  verifier() {
    return { statut: 'ok', horodatage: new Date().toISOString() };
  }
}
