import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneOrmEntity } from './zone.orm-entity';
import { AntenneOrmEntity } from './antenne.orm-entity';

/**
 * Antennes réelles Phase 1 / Sprint 2 (cahier des charges §5.5). Leader et
 * coordinateur ne sont pas encore nommés dans les documents disponibles
 * ("À nommer — DBC Légende requis") — laissés null plutôt qu'inventés.
 */
const ANTENNES = [
  { ville: 'Yaoundé Centre', statut: 'lancement' as const },
  { ville: 'Douala Akwa', statut: 'lancement' as const },
  { ville: 'Bafoussam', statut: 'preparation' as const },
];

@Injectable()
export class CommunauteBootstrap implements OnModuleInit {
  private readonly logger = new Logger(CommunauteBootstrap.name);

  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly zones: Repository<ZoneOrmEntity>,
    @InjectRepository(AntenneOrmEntity)
    private readonly antennes: Repository<AntenneOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existantes = await this.zones.count();
    if (existantes > 0) {
      return;
    }

    const zoneCameroun = await this.zones.save({ nom: 'Cameroun', type: 'Afrique Centrale' });
    await this.antennes.save(
      ANTENNES.map((antenne) => ({
        zoneId: zoneCameroun.id,
        ville: antenne.ville,
        statut: antenne.statut,
        leaderMembreId: null,
        coordinateurMembreId: null,
      })),
    );
    this.logger.log(`Zone Cameroun et ${ANTENNES.length} antennes initialisées.`);
  }
}
