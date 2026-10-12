import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lecon } from '../domaine/lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { LeconOrmEntity } from './lecon.orm-entity';

@Injectable()
export class LeconPostgresRepository implements LeconRepositoryPort {
  constructor(
    @InjectRepository(LeconOrmEntity)
    private readonly repository: Repository<LeconOrmEntity>,
  ) {}

  async sauvegarder(lecon: Lecon): Promise<Lecon> {
    const ligne = await this.repository.save({
      id: lecon.id,
      moduleFormationId: lecon.moduleFormationId,
      titre: lecon.titre,
      type: lecon.type,
      url: lecon.url,
      quiz: lecon.quiz,
      ordre: lecon.ordre,
    });
    return this.versDomaine(ligne);
  }

  async listerParModuleId(moduleFormationId: string): Promise<Lecon[]> {
    const lignes = await this.repository.find({ where: { moduleFormationId } });
    return lignes.map((l) => this.versDomaine(l));
  }

  async supprimer(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async trouverParId(id: string): Promise<Lecon | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: LeconOrmEntity): Lecon {
    return Lecon.depuisPersistance({
      id: ligne.id,
      moduleFormationId: ligne.moduleFormationId,
      titre: ligne.titre,
      type: ligne.type,
      url: ligne.url,
      quiz: ligne.quiz,
      ordre: ligne.ordre,
    });
  }
}
