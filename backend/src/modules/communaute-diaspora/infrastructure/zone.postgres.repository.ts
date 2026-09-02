import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../domaine/zone';
import { ZoneRepositoryPort } from '../domaine/zone.repository.port';
import { ZoneOrmEntity } from './zone.orm-entity';

@Injectable()
export class ZonePostgresRepository implements ZoneRepositoryPort {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly repository: Repository<ZoneOrmEntity>,
  ) {}

  async listerTous(): Promise<Zone[]> {
    const lignes = await this.repository.find();
    return lignes.map((ligne) => Zone.depuisPersistance(ligne));
  }
}
