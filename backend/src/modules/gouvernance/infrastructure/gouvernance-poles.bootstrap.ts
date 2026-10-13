import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoleOrmEntity } from './pole.orm-entity';
import { SiegeOrmEntity } from './siege.orm-entity';
import { TypePole } from '../domaine/pole';

interface PoleInitial {
  code: string;
  nom: string;
  description: string;
  icone: string;
  type: TypePole;
  niveauCode?: string;
  sieges: string[];
  /** Noms d'une version précédente (en anglais) : remplacés s'ils n'ont pas été modifiés depuis. */
  ancienNom?: string;
  anciensSieges?: string[];
}

/**
 * Organigramme réel de la gouvernance DBC (Admin/Gouvernance) : les 4 pôles
 * d'origine, avec leurs textes français. Les sièges naissent vacants, à
 * attribuer ensuite par l'admin.
 *
 * Idempotent : sur une base qui existe déjà, il ajoute seulement ce qui
 * manque (pôles "reseau" et "niveau" créés après coup, types) et traduit les
 * noms anglais de la toute première version tant que l'admin ne les a pas
 * renommés.
 */
const POLES: PoleInitial[] = [
  {
    code: 'founding-leadership',
    nom: 'Direction Fondatrice',
    description: 'Fondateur & CEO — Vision stratégique globale et arbitrage final',
    icone: 'sparkles',
    type: 'fondatrice',
    sieges: ['Fondateur & CEO'],
    ancienNom: 'Founding Leadership',
    anciensSieges: ['Founder & CEO'],
  },
  {
    code: 'executive-committee',
    nom: 'Comité Exécutif',
    description: '5 Directeurs : Opérations · Financier · Formations · Marketing Digital · Diaspora',
    icone: 'briefcase',
    type: 'sieges',
    sieges: [
      'Directeur Opérations',
      'Directeur Financier',
      'Directeur Formations',
      'Directeur Marketing Digital',
      'Directeur Diaspora',
    ],
    ancienNom: 'Executive Committee',
    anciensSieges: [
      'Operations Director',
      'Finance Director',
      'Training Director',
      'Digital Marketing Director',
      'Diaspora Director',
    ],
  },
  {
    code: 'chapter-leaders',
    nom: "Réseau des Leaders d'Antennes",
    description: 'Binôme Leader Légende + Coordinateur dans chaque chapitre local et antenne diaspora',
    icone: 'globe',
    type: 'reseau',
    sieges: [],
  },
  {
    code: 'legends-council',
    nom: 'Conseil des Légendes',
    description: 'Tous les membres Niveau 8 — consultés pour les décisions stratégiques majeures',
    icone: 'trophy',
    type: 'niveau',
    niveauCode: 'legende',
    sieges: [],
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
    const existants = await this.poles.find();
    let ordreMax = existants.reduce((max, pole) => Math.max(max, pole.ordre), 0);
    let ajoutes = 0;

    for (const initial of POLES) {
      const existant = existants.find((pole) => pole.code === initial.code);
      if (!existant) {
        ordreMax += 1;
        const ligne = await this.poles.save({
          code: initial.code,
          nom: initial.nom,
          description: initial.description,
          ordre: ordreMax,
          icone: initial.icone,
          type: initial.type,
          niveauCode: initial.niveauCode ?? null,
        });
        await this.sieges.save(
          initial.sieges.map((titre, index) => ({ poleId: ligne.id, titre, ordre: index + 1, membreId: null })),
        );
        ajoutes++;
        continue;
      }

      const traduit = existant.nom === initial.ancienNom;
      await this.poles.save({
        ...existant,
        type: initial.type,
        niveauCode: initial.niveauCode ?? null,
        ...(traduit ? { nom: initial.nom, description: initial.description } : {}),
      });
      if (traduit && initial.anciensSieges) {
        for (const siege of await this.sieges.find({ where: { poleId: existant.id } })) {
          const index = initial.anciensSieges.indexOf(siege.titre);
          if (index >= 0) {
            await this.sieges.save({ ...siege, titre: initial.sieges[index] });
          }
        }
      }
    }

    if (ajoutes > 0) {
      this.logger.log(`${ajoutes} pôle(s) de gouvernance initialisé(s).`);
    }
  }
}
