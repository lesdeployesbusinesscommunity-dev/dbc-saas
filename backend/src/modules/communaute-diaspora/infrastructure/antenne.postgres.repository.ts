import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Antenne } from '../domaine/antenne';
import { AntenneRepositoryPort } from '../domaine/antenne.repository.port';
import { AntenneOrmEntity } from './antenne.orm-entity';

@Injectable()
export class AntennePostgresRepository implements AntenneRepositoryPort {
  constructor(
    @InjectRepository(AntenneOrmEntity)
    private readonly repository: Repository<AntenneOrmEntity>,
  ) {}

  async sauvegarder(antenne: Antenne): Promise<Antenne> {
    const ligne = await this.repository.save({
      id: antenne.id,
      zoneId: antenne.zoneId,
      ville: antenne.ville,
      statut: antenne.statut,
      leaderMembreId: antenne.leaderMembreId,
      coordinateurMembreId: antenne.coordinateurMembreId,
    });
    return Antenne.depuisPersistance(ligne);
  }

  async trouverParId(id: string): Promise<Antenne | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? Antenne.depuisPersistance(ligne) : null;
  }

  async listerTous(): Promise<Antenne[]> {
    const lignes = await this.repository.find();
    return lignes.map((ligne) => Antenne.depuisPersistance(ligne));
  }
}
