import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pole } from '../domaine/pole';
import { PoleRepositoryPort } from '../domaine/pole.repository.port';
import { PoleOrmEntity } from './pole.orm-entity';

@Injectable()
export class PolePostgresRepository implements PoleRepositoryPort {
  constructor(
    @InjectRepository(PoleOrmEntity)
    private readonly repository: Repository<PoleOrmEntity>,
  ) {}

  async listerTous(): Promise<Pole[]> {
    const lignes = await this.repository.find({ order: { ordre: 'ASC' } });
    return lignes.map((ligne) => Pole.depuisPersistance(ligne));
  }
}
