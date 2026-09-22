import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PilierOrmEntity } from './pilier.orm-entity';
import { ProgrammeOrmEntity } from './programme.orm-entity';

/** Les 4 vrais piliers DBC et leurs programmes nommés — cahier des charges §1.2. */
const PILIERS = [
  { code: 'financer', nom: '01 · FINANCER', tagline: "Le nerf de la guerre, c'est l'argent." },
  { code: 'former', nom: '02 · FORMER', tagline: "L'argent sans compétence s'envole." },
  { code: 'reseauter', nom: '03 · RÉSEAUTER', tagline: 'Votre réseau, c’est votre valeur nette.' },
  { code: 'investir', nom: '04 · INVESTIR', tagline: 'La vraie richesse se construit en investissant.' },
];

const PROGRAMMES: { pilierCode: string; nom: string }[] = [
  { pilierCode: 'financer', nom: 'Tontine Royale' },
  { pilierCode: 'financer', nom: 'MLM Longrich' },
  { pilierCode: 'financer', nom: 'Crédit Solidaire' },
  { pilierCode: 'financer', nom: 'Micro-Equity' },
  { pilierCode: 'financer', nom: 'Invest Club' },
  { pilierCode: 'former', nom: 'École des Affaires' },
  { pilierCode: 'former', nom: 'Leadership Academy' },
  { pilierCode: 'former', nom: 'Digital Masters' },
  { pilierCode: 'former', nom: 'Pitch School' },
  { pilierCode: 'former', nom: 'Sales Academy' },
  { pilierCode: 'reseauter', nom: 'Mastermind Circles' },
  { pilierCode: 'reseauter', nom: 'Speed Networking' },
  { pilierCode: 'reseauter', nom: 'Mentor Connect' },
  { pilierCode: 'reseauter', nom: 'DBC Summit' },
  { pilierCode: 'reseauter', nom: 'Marketplace' },
  { pilierCode: 'investir', nom: 'Diaspora Fund' },
  { pilierCode: 'investir', nom: 'Joint-Ventures' },
  { pilierCode: 'investir', nom: 'Export-Import Club' },
  { pilierCode: 'investir', nom: 'Real Estate' },
  { pilierCode: 'investir', nom: 'DBC Consulting' },
];

@Injectable()
export class ProgrammesBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ProgrammesBootstrap.name);

  constructor(
    @InjectRepository(PilierOrmEntity)
    private readonly piliers: Repository<PilierOrmEntity>,
    @InjectRepository(ProgrammeOrmEntity)
    private readonly programmes: Repository<ProgrammeOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existants = await this.piliers.count();
    if (existants > 0) {
      return;
    }

    await this.piliers.save(PILIERS);
    await this.programmes.save(PROGRAMMES.map((p) => ({ ...p, niveauMinimumRequisId: null })));
    this.logger.log(`${PILIERS.length} piliers et ${PROGRAMMES.length} programmes DBC initialisés.`);
  }
}
