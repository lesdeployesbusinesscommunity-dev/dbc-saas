import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoleOrmEntity } from './pole.orm-entity';
import { SiegeOrmEntity } from './siege.orm-entity';

/**
 * Organigramme réel de la gouvernance DBC, déjà présent dans la maquette
 * frontend (Admin/Gouvernance) : tous les sièges naissent vacants
 * (membreId null), à assigner ensuite via POST /gouvernance/sieges/:id/assigner.
 * Le "Chapter Leaders Network" (3e pôle de la maquette) n'est pas repris
 * ici : il correspond déjà aux antennes existantes (module Communauté &
 * diaspora, GET /communaute/antennes, avec leaderMembreId/coordinatorMembreId).
 */
const POLES = [
  {
    code: 'founding-leadership',
    nom: 'Founding Leadership',
    description: 'Founder & CEO — Overall strategic vision and final arbitration',
    ordre: 1,
    icone: 'sparkles',
    sieges: [{ titre: 'Founder & CEO', ordre: 1 }],
  },
  {
    code: 'executive-committee',
    nom: 'Executive Committee',
    description: '5 Directors: Operations, Finance, Training, Digital Marketing, Diaspora',
    ordre: 2,
    icone: 'briefcase',
    sieges: [
      { titre: 'Operations Director', ordre: 1 },
      { titre: 'Finance Director', ordre: 2 },
      { titre: 'Training Director', ordre: 3 },
      { titre: 'Digital Marketing Director', ordre: 4 },
      { titre: 'Diaspora Director', ordre: 5 },
    ],
  },
];

@Injectable()
export class GouvernancePolesBootstrap implements OnModuleInit {
  private readonly logger = new Logger(GouvernancePolesBootstrap.name);

  constructor(
    @InjectRepository(PoleOrmEntity)
    private readonly poles: Repository<PoleOrmEntity>,
    @InjectRepository(SiegeOrmEntity)
    private readonly sieges: Repository<SiegeOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existants = await this.poles.count();
    if (existants > 0) {
      return;
    }

    for (const pole of POLES) {
      const ligne = await this.poles.save({
        code: pole.code,
        nom: pole.nom,
        description: pole.description,
        ordre: pole.ordre,
        icone: pole.icone,
      });
      await this.sieges.save(
        pole.sieges.map((siege) => ({
          poleId: ligne.id,
          titre: siege.titre,
          ordre: siege.ordre,
          membreId: null,
        })),
      );
    }
    this.logger.log(`${POLES.length} pôles de gouvernance initialisés.`);
  }
}
