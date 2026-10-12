import { Module } from '@nestjs/common';
import { FichiersController } from './fichiers.controller';

/**
 * Téléversement de fichiers (voir FichiersController). Les fichiers sont
 * servis en lecture par main.ts (useStaticAssets) sous /fichiers.
 */
@Module({
  controllers: [FichiersController],
})
export class FichiersModule {}
