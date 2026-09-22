import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackMlmOrmEntity } from './pack-mlm.orm-entity';

/** Les 6 vrais packs Longrich — cahier des charges §5.2 (voir mémoire "Packs Longrich réels"). */
const PACKS_LONGRICH = [
  { code: 'decouverte', nom: 'Pack Découverte', prix: 24_000, pointsPv: 4, niveauRequisCode: 'batisseur_pro', typeGains: 'parrainage_seul' as const },
  { code: 'bronze', nom: 'Pack Bronze', prix: 90_000, pointsPv: 60, niveauRequisCode: 'performer', typeGains: 'performance' as const },
  { code: 'silver', nom: 'Pack Silver', prix: 150_000, pointsPv: 120, niveauRequisCode: 'performer_pro', typeGains: 'performance' as const },
  { code: 'gold', nom: 'Pack Gold', prix: 330_000, pointsPv: 240, niveauRequisCode: 'strategie', typeGains: 'performance' as const },
  { code: 'platinum', nom: 'Pack Platinum', prix: 800_000, pointsPv: 720, niveauRequisCode: 'elite', typeGains: 'performance' as const },
  { code: 'diamond', nom: 'Pack Diamond', prix: 1_800_000, pointsPv: 1_680, niveauRequisCode: 'legende', typeGains: 'performance' as const },
];

@Injectable()
export class ReseauMlmBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ReseauMlmBootstrap.name);

  constructor(
    @InjectRepository(PackMlmOrmEntity)
    private readonly packs: Repository<PackMlmOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.packs.manager.query(
      'CREATE INDEX IF NOT EXISTS idx_parrainages_mlm_chemin ON parrainages_mlm USING GIST (chemin)',
    );

    const existants = await this.packs.count();
    if (existants > 0) {
      return;
    }

    await this.packs.save(PACKS_LONGRICH);
    this.logger.log(`Catalogue des ${PACKS_LONGRICH.length} packs Longrich initialisé.`);
  }
}
