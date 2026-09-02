import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pilier } from '../domaine/pilier';
import { PilierRepositoryPort } from '../domaine/pilier.repository.port';
import { PilierOrmEntity } from './pilier.orm-entity';

@Injectable()
export class PilierPostgresRepository implements PilierRepositoryPort {
  constructor(
    @InjectRepository(PilierOrmEntity)
    private readonly repository: Repository<PilierOrmEntity>,
  ) {}

  async listerTous(): Promise<Pilier[]> {
    const lignes = await this.repository.find();
    return lignes.map((ligne) => Pilier.depuisPersistance(ligne));
  }
}
