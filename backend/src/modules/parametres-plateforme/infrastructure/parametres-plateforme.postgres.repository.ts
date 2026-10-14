import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametresPlateforme } from '../domaine/parametres-plateforme';
import { ParametresPlateformeRepositoryPort } from '../domaine/parametres-plateforme.repository.port';
import { ParametresPlateformeOrmEntity } from './parametres-plateforme.orm-entity';

const ID_UNIQUE = 1;

@Injectable()
export class ParametresPlateformePostgresRepository implements ParametresPlateformeRepositoryPort {
  constructor(
    @InjectRepository(ParametresPlateformeOrmEntity)
    private readonly repository: Repository<ParametresPlateformeOrmEntity>,
  ) {}

  async lire(): Promise<unknown | null> {
    const ligne = await this.repository.findOne({ where: { id: ID_UNIQUE } });
    return ligne?.valeur ?? null;
  }

  async enregistrer(parametres: ParametresPlateforme): Promise<void> {
    await this.repository.save({ id: ID_UNIQUE, valeur: parametres as unknown as Record<string, unknown> });
  }
}
