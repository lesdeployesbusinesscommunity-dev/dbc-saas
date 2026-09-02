import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogueActionsCoins } from '../domaine/catalogue-actions-coins';
import { CatalogueActionsCoinsRepositoryPort } from '../domaine/catalogue-actions-coins.repository.port';
import { CatalogueActionsCoinsOrmEntity } from './catalogue-actions-coins.orm-entity';

@Injectable()
export class CatalogueActionsCoinsPostgresRepository implements CatalogueActionsCoinsRepositoryPort {
  constructor(
    @InjectRepository(CatalogueActionsCoinsOrmEntity)
    private readonly repository: Repository<CatalogueActionsCoinsOrmEntity>,
  ) {}

  async trouverParCode(code: string): Promise<CatalogueActionsCoins | null> {
    const ligne = await this.repository.findOne({ where: { code } });
    return ligne ? CatalogueActionsCoins.depuisPersistance(ligne) : null;
  }

  async listerTous(): Promise<CatalogueActionsCoins[]> {
    const lignes = await this.repository.find();
    return lignes.map((ligne) => CatalogueActionsCoins.depuisPersistance(ligne));
  }
}
