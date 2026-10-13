import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReseauTerritorial } from '../domaine/reseau-territorial';
import { ReseauTerritorialRepositoryPort } from '../domaine/reseau-territorial.repository.port';
import { ReseauTerritorialOrmEntity } from './reseau-territorial.orm-entity';

@Injectable()
export class ReseauTerritorialPostgresRepository implements ReseauTerritorialRepositoryPort {
  constructor(
    @InjectRepository(ReseauTerritorialOrmEntity)
    private readonly repository: Repository<ReseauTerritorialOrmEntity>,
  ) {}

  async listerTous(): Promise<ReseauTerritorial[]> {
    const lignes = await this.repository.find({ order: { pays: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async trouverParPays(pays: string): Promise<ReseauTerritorial | null> {
    const ligne = await this.repository.findOne({ where: { pays } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async sauvegarder(reseau: ReseauTerritorial): Promise<ReseauTerritorial> {
    const ligne = await this.repository.save({
      pays: reseau.pays,
      racine: reseau.racine,
      titresNiveaux: reseau.titresNiveaux,
    });
    return this.versDomaine(ligne);
  }

  async supprimer(pays: string): Promise<void> {
    await this.repository.delete({ pays });
  }

  private versDomaine(ligne: ReseauTerritorialOrmEntity): ReseauTerritorial {
    return ReseauTerritorial.depuisPersistance({
      pays: ligne.pays,
      racine: ligne.racine,
      titresNiveaux: ligne.titresNiveaux ?? {},
    });
  }
}
