import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogueActionsCoinsOrmEntity } from './catalogue-actions-coins.orm-entity';

/**
 * Actions réelles listées dans le cahier des charges §5.3. Certaines ne sont
 * pas encore déclenchables automatiquement (Formation, Tontine, Antennes,
 * Événements ne sont pas construits) — le catalogue existe déjà pour que
 * l'attribution manuelle (cas d'utilisation 6.3) reste cohérente en attendant.
 */
const ACTIONS_COINS = [
  { code: 'formation_completee', valeurCoins: 50 },
  { code: 'parrainage_membre_actif_niv3plus', valeurCoins: 100 },
  { code: 'temoignage_valide', valeurCoins: 30 },
  { code: 'tontine_sans_echec_annuel', valeurCoins: 40 },
  { code: 'entreprise_lancee_post_formation', valeurCoins: 150 },
  { code: 'leader_antenne_mensuel', valeurCoins: 80 },
  { code: 'challenge_mensuel_reussi', valeurCoins: 75 },
  { code: 'dbc_tour_summit', valeurCoins: 200 },
];

@Injectable()
export class GamificationBootstrap implements OnModuleInit {
  private readonly logger = new Logger(GamificationBootstrap.name);

  constructor(
    @InjectRepository(CatalogueActionsCoinsOrmEntity)
    private readonly catalogue: Repository<CatalogueActionsCoinsOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existants = await this.catalogue.count();
    if (existants > 0) {
      return;
    }

    await this.catalogue.save(ACTIONS_COINS.map((action) => ({ ...action, actif: true })));
    this.logger.log(`Catalogue des ${ACTIONS_COINS.length} actions DBC Coins initialisé.`);
  }
}
