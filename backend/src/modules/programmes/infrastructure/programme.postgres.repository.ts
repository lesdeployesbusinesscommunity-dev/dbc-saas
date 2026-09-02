import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programme } from '../domaine/programme';
import { ProgrammeRepositoryPort } from '../domaine/programme.repository.port';
import { ProgrammeOrmEntity } from './programme.orm-entity';

@Injectable()
export class ProgrammePostgresRepository implements ProgrammeRepositoryPort {
  constructor(
    @InjectRepository(ProgrammeOrmEntity)
    private readonly repository: Repository<ProgrammeOrmEntity>,
  ) {}

  async listerTous(): Promise<Programme[]> {
    const lignes = await this.repository.find();
    return lignes.map((ligne) => Programme.depuisPersistance(ligne));
  }

  async listerParPilier(pilierCode: string): Promise<Programme[]> {
    const lignes = await this.repository.find({ where: { pilierCode } });
    return lignes.map((ligne) => Programme.depuisPersistance(ligne));
  }
}
