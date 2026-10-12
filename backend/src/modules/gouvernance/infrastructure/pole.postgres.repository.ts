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

  async trouverParId(id: number): Promise<Pole | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? Pole.depuisPersistance(ligne) : null;
  }

  async sauvegarder(pole: Pole): Promise<Pole> {
    const ligne = await this.repository.save({
      id: pole.id,
      code: pole.code,
      nom: pole.nom,
      description: pole.description,
      ordre: pole.ordre,
      icone: pole.icone,
    });
    return Pole.depuisPersistance(ligne);
  }

  async supprimer(id: number): Promise<void> {
    await this.repository.delete({ id });
  }
}
