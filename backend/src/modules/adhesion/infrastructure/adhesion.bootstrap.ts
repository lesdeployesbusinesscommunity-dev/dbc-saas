import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NiveauAdhesionOrmEntity } from './niveau-adhesion.orm-entity';

/**
 * Catalogue réel des 8 niveaux DBC — cahier des charges §1.4 (cotisation,
 * cagnotte, commission) et §5.3 (bonus coins/mois). Les "avantages" détaillés
 * ne sont pas encore spécifiés dans les documents disponibles — laissés vides
 * plutôt qu'inventés.
 */
const NIVEAUX_DBC = [
  { code: 'starter', nom: 'DBC Starter', cotisationMensuelle: 5_000, montantCagnotte: 55_000, commissionParrainage: 1_000, coinsParMois: 0 },
  { code: 'batisseur', nom: 'DBC Bâtisseur', cotisationMensuelle: 10_000, montantCagnotte: 110_000, commissionParrainage: 2_000, coinsParMois: 50 },
  { code: 'batisseur_pro', nom: 'DBC Bâtisseur Pro', cotisationMensuelle: 30_000, montantCagnotte: 330_000, commissionParrainage: 5_000, coinsParMois: 100 },
  { code: 'performer', nom: 'DBC Performer', cotisationMensuelle: 100_000, montantCagnotte: 1_100_000, commissionParrainage: 10_000, coinsParMois: 150 },
  { code: 'performer_pro', nom: 'DBC Performer Pro', cotisationMensuelle: 165_000, montantCagnotte: 1_815_000, commissionParrainage: 15_000, coinsParMois: 200 },
  { code: 'strategie', nom: 'DBC Stratège', cotisationMensuelle: 350_000, montantCagnotte: 3_850_000, commissionParrainage: 20_000, coinsParMois: 300 },
  { code: 'elite', nom: 'DBC Elite', cotisationMensuelle: 900_000, montantCagnotte: 9_900_000, commissionParrainage: 100_000, coinsParMois: 500 },
  { code: 'legende', nom: 'DBC Légende', cotisationMensuelle: 2_000_000, montantCagnotte: 22_000_000, commissionParrainage: 200_000, coinsParMois: 1000 },
] as const;

@Injectable()
export class AdhesionBootstrap implements OnModuleInit {
  private readonly logger = new Logger(AdhesionBootstrap.name);

  constructor(
    @InjectRepository(NiveauAdhesionOrmEntity)
    private readonly niveaux: Repository<NiveauAdhesionOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.niveaux.manager.query('CREATE SEQUENCE IF NOT EXISTS matricule_sequence START 1');

    const existants = await this.niveaux.count();
    if (existants > 0) {
      return;
    }

    await this.niveaux.save(NIVEAUX_DBC.map((niveau) => ({ ...niveau, avantages: [] })));
    this.logger.log(`Catalogue des ${NIVEAUX_DBC.length} niveaux DBC initialisé.`);
  }
}
