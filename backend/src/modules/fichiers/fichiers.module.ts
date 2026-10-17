import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FichiersController } from './fichiers.controller';
import { StockageFichiersPort } from './stockage-fichiers.port';
import { StockageFichiersDisque } from './stockage-fichiers.disque';
import { StockageFichiersR2 } from './stockage-fichiers.r2';

/**
 * Téléversement de fichiers (voir FichiersController). Stockage dans
 * Cloudflare R2 si les variables R2_* sont définies, sinon sur le disque du
 * serveur, servi en lecture par main.ts (useStaticAssets) sous /fichiers.
 */
@Module({
  controllers: [FichiersController],
  providers: [
    {
      provide: StockageFichiersPort,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('fichiers.r2') ? new StockageFichiersR2(config) : new StockageFichiersDisque(config),
    },
  ],
})
export class FichiersModule {}
