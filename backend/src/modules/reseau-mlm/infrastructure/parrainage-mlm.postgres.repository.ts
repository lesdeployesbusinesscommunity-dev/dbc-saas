import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParrainageMlm } from '../domaine/parrainage-mlm';
import { ParrainageMlmRepositoryPort } from '../domaine/parrainage-mlm.repository.port';
import { ParrainageMlmOrmEntity } from './parrainage-mlm.orm-entity';

interface LigneBrute {
  id: string;
  membre_id: string;
  chemin: string;
  profondeur: number;
}

/**
 * Les traversées d'arbre (ancêtres/descendants) utilisent les opérateurs ltree
 * (<@, @>) via des requêtes SQL brutes — non exprimables avec le query builder
 * TypeORM classique. Voir docker/init-extensions.sql pour l'extension ltree.
 */
@Injectable()
export class ParrainageMlmPostgresRepository implements ParrainageMlmRepositoryPort {
  constructor(
    @InjectRepository(ParrainageMlmOrmEntity)
    private readonly repository: Repository<ParrainageMlmOrmEntity>,
  ) {}

  async sauvegarder(parrainage: ParrainageMlm): Promise<ParrainageMlm> {
    const ligne = await this.repository.save({
      id: parrainage.id,
      membreId: parrainage.membreId,
      chemin: parrainage.chemin,
      profondeur: parrainage.profondeur,
    });
    return this.versDomaine({
      id: ligne.id,
      membre_id: ligne.membreId,
      chemin: ligne.chemin,
      profondeur: ligne.profondeur,
    });
  }

  async trouverParMembreId(membreId: string): Promise<ParrainageMlm | null> {
    const ligne = await this.repository.findOne({ where: { membreId } });
    if (!ligne) {
      return null;
    }
    return this.versDomaine({ id: ligne.id, membre_id: ligne.membreId, chemin: ligne.chemin, profondeur: ligne.profondeur });
  }

  async listerAncetres(membreId: string): Promise<ParrainageMlm[]> {
    const soi = await this.trouverParMembreId(membreId);
    if (!soi) {
      return [];
    }
    const lignes: LigneBrute[] = await this.repository.manager.query(
      `SELECT id, membre_id, chemin::text AS chemin, profondeur
       FROM parrainages_mlm
       WHERE chemin @> $1::ltree AND chemin != $1::ltree
       ORDER BY profondeur DESC`,
      [soi.chemin],
    );
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async listerDescendantsDirects(membreId: string): Promise<ParrainageMlm[]> {
    const soi = await this.trouverParMembreId(membreId);
    if (!soi) {
      return [];
    }
    const lignes: LigneBrute[] = await this.repository.manager.query(
      `SELECT id, membre_id, chemin::text AS chemin, profondeur
       FROM parrainages_mlm
       WHERE chemin <@ $1::ltree AND profondeur = $2`,
      [soi.chemin, soi.profondeur + 1],
    );
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: LigneBrute): ParrainageMlm {
    return ParrainageMlm.depuisPersistance({
      id: ligne.id,
      membreId: ligne.membre_id,
      chemin: ligne.chemin,
      profondeur: ligne.profondeur,
    });
  }
}
