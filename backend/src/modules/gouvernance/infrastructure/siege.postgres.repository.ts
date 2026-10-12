import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Siege } from '../domaine/siege';
import { SiegeRepositoryPort } from '../domaine/siege.repository.port';
import { SiegeOrmEntity } from './siege.orm-entity';

@Injectable()
export class SiegePostgresRepository implements SiegeRepositoryPort {
  constructor(
    @InjectRepository(SiegeOrmEntity)
    private readonly repository: Repository<SiegeOrmEntity>,
  ) {}

  async listerTous(): Promise<Siege[]> {
    const lignes = await this.repository.find({ order: { ordre: 'ASC' } });
    return lignes.map((ligne) => Siege.depuisPersistance(ligne));
  }

  async trouverParId(id: string): Promise<Siege | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? Siege.depuisPersistance(ligne) : null;
  }

  async listerParPoleId(poleId: number): Promise<Siege[]> {
    const lignes = await this.repository.find({ where: { poleId }, order: { ordre: 'ASC' } });
    return lignes.map((ligne) => Siege.depuisPersistance(ligne));
  }

  async sauvegarder(siege: Siege): Promise<Siege> {
    const ligne = await this.repository.save({
      id: siege.id,
      poleId: siege.poleId,
      titre: siege.titre,
      ordre: siege.ordre,
      membreId: siege.membreId,
    });
    return Siege.depuisPersistance(ligne);
  }

  async supprimer(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
