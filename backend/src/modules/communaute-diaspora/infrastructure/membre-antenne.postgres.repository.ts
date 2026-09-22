import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembreAntenne } from '../domaine/membre-antenne';
import { MembreAntenneRepositoryPort } from '../domaine/membre-antenne.repository.port';
import { MembreAntenneOrmEntity } from './membre-antenne.orm-entity';

@Injectable()
export class MembreAntennePostgresRepository implements MembreAntenneRepositoryPort {
  constructor(
    @InjectRepository(MembreAntenneOrmEntity)
    private readonly repository: Repository<MembreAntenneOrmEntity>,
  ) {}

  async sauvegarder(membreAntenne: MembreAntenne): Promise<MembreAntenne> {
    const ligne = await this.repository.save({
      id: membreAntenne.id,
      antenneId: membreAntenne.antenneId,
      membreId: membreAntenne.membreId,
    });
    return MembreAntenne.depuisPersistance(ligne);
  }

  async existeDeja(antenneId: string, membreId: string): Promise<boolean> {
    const compte = await this.repository.count({ where: { antenneId, membreId } });
    return compte > 0;
  }
}
