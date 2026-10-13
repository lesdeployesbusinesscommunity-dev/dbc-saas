import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PilierOrmEntity } from './pilier.orm-entity';
import { ProgrammeOrmEntity } from './programme.orm-entity';

/** Les 4 vrais piliers DBC — cahier des charges §1.2. */
const PILIERS = [
  { code: 'financer', nom: '01 · FINANCER', tagline: "Le nerf de la guerre, c'est l'argent." },
  { code: 'former', nom: '02 · FORMER', tagline: "L'argent sans compétence s'envole." },
  { code: 'reseauter', nom: '03 · RÉSEAUTER', tagline: 'Votre réseau, c’est votre valeur nette.' },
  { code: 'investir', nom: '04 · INVESTIR', tagline: 'La vraie richesse se construit en investissant.' },
];

/**
 * Catalogue DBC des programmes, identique à celui des interfaces (page
 * "Piliers" : mêmes codes, même ordre). "ancienNom" : nom sous lequel une
 * version précédente de ce fichier l'avait semé, pour retrouver la ligne.
 */
const PROGRAMMES: { code: string; pilierCode: string; nom: string; statut: string; ancienNom?: string }[] = [
  { code: 'tontine-royale', pilierCode: 'financer', nom: 'Tontine Royale', statut: 'active', ancienNom: 'Tontine Royale' },
  { code: 'invest-club', pilierCode: 'financer', nom: 'DBC Invest Club', statut: 'active', ancienNom: 'Invest Club' },
  { code: 'mlm-longrich', pilierCode: 'financer', nom: 'Business MLM (Longrich)', statut: 'active', ancienNom: 'MLM Longrich' },
  { code: 'credit-solidaire', pilierCode: 'financer', nom: 'Crédit Solidaire', statut: 'active', ancienNom: 'Crédit Solidaire' },
  { code: 'micro-equity', pilierCode: 'financer', nom: 'Micro-Equity', statut: 'active', ancienNom: 'Micro-Equity' },
  { code: 'dbc-bank', pilierCode: 'financer', nom: 'DBC Bank', statut: 'project' },
  { code: 'ecole-affaires', pilierCode: 'former', nom: 'École des Affaires DBC', statut: 'active', ancienNom: 'École des Affaires' },
  { code: 'leadership-academy', pilierCode: 'former', nom: 'Leadership Academy', statut: 'active', ancienNom: 'Leadership Academy' },
  { code: 'digital-masters', pilierCode: 'former', nom: 'Digital Masters', statut: 'active', ancienNom: 'Digital Masters' },
  { code: 'pitch-school', pilierCode: 'former', nom: 'Pitch School', statut: 'active', ancienNom: 'Pitch School' },
  { code: 'sales-academy', pilierCode: 'former', nom: 'Sales Academy', statut: 'active', ancienNom: 'Sales Academy' },
  { code: 'dbc-challenge', pilierCode: 'former', nom: 'DBC Challenge', statut: 'active' },
  { code: 'mastermind', pilierCode: 'reseauter', nom: 'Mastermind Circles', statut: 'active', ancienNom: 'Mastermind Circles' },
  { code: 'speed-networking', pilierCode: 'reseauter', nom: 'Speed Networking', statut: 'active', ancienNom: 'Speed Networking' },
  { code: 'mentor-connect', pilierCode: 'reseauter', nom: 'Mentor Connect', statut: 'active', ancienNom: 'Mentor Connect' },
  { code: 'summit', pilierCode: 'reseauter', nom: 'DBC Summit Annuel', statut: 'active', ancienNom: 'DBC Summit' },
  { code: 'dbc-tour', pilierCode: 'reseauter', nom: 'DBC Tour', statut: 'active' },
  { code: 'marketplace', pilierCode: 'reseauter', nom: 'DBC Marketplace', statut: 'active', ancienNom: 'Marketplace' },
  { code: 'diaspo-fund', pilierCode: 'investir', nom: 'DBC Diaspo Fund', statut: 'active', ancienNom: 'Diaspora Fund' },
  { code: 'export-import', pilierCode: 'investir', nom: 'Export-Import Club', statut: 'active', ancienNom: 'Export-Import Club' },
  { code: 'joint-ventures', pilierCode: 'investir', nom: 'Joint-Ventures Projets', statut: 'active', ancienNom: 'Joint-Ventures' },
  { code: 'real-estate', pilierCode: 'investir', nom: 'Communs Real Estate', statut: 'active', ancienNom: 'Real Estate' },
  { code: 'invest-back-home', pilierCode: 'investir', nom: 'Invest Back Home', statut: 'active' },
  { code: 'consulting', pilierCode: 'investir', nom: 'DBC Consulting', statut: 'active', ancienNom: 'DBC Consulting' },
];

/**
 * Sème les piliers, puis complète le catalogue des programmes : chaque
 * programme DBC absent est ajouté, et une ligne semée avant l'ajout des codes
 * reçoit le sien (sans toucher aux réglages de l'administrateur).
 */
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
    if ((await this.piliers.count()) === 0) {
      await this.piliers.save(PILIERS);
      this.logger.log(`${PILIERS.length} piliers DBC initialisés.`);
    }

    const sansCode = await this.programmes.find({ where: { code: IsNull() } });
    let ajoutes = 0;
    for (const entree of PROGRAMMES) {
      if (await this.programmes.findOne({ where: { code: entree.code } })) continue;
      const ancienne = sansCode.find((ligne) => ligne.nom === entree.ancienNom);
      if (ancienne) {
        await this.programmes.update(ancienne.id, { code: entree.code, nom: entree.nom });
        continue;
      }
      await this.programmes.save({
        code: entree.code,
        pilierCode: entree.pilierCode,
        nom: entree.nom,
        niveauMinimumRequisId: null,
        statut: entree.statut,
        visible: true,
        resume: null,
        explication: null,
        ajouteParAdmin: false,
      });
      ajoutes += 1;
    }
    if (ajoutes > 0) {
      this.logger.log(`${ajoutes} programme(s) DBC ajouté(s) au catalogue.`);
    }
  }
}
