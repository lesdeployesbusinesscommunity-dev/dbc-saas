import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NiveauAdhesion } from '../domaine/niveau-adhesion';
import { NiveauAdhesionRepositoryPort } from '../domaine/niveau-adhesion.repository.port';
import { NiveauAdhesionOrmEntity } from './niveau-adhesion.orm-entity';

@Injectable()
export class NiveauAdhesionPostgresRepository implements NiveauAdhesionRepositoryPort {
  constructor(
    @InjectRepository(NiveauAdhesionOrmEntity)
    private readonly repository: Repository<NiveauAdhesionOrmEntity>,
  ) {}

  async trouverParCode(code: string): Promise<NiveauAdhesion | null> {
    const ligne = await this.repository.findOne({ where: { code } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParId(id: number): Promise<NiveauAdhesion | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerTous(): Promise<NiveauAdhesion[]> {
    const lignes = await this.repository.find({ order: { id: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: NiveauAdhesionOrmEntity): NiveauAdhesion {
    return NiveauAdhesion.depuisPersistance({
      id: ligne.id,
      code: ligne.code,
      nom: ligne.nom,
      cotisationMensuelle: Number(ligne.cotisationMensuelle),
      montantCagnotte: Number(ligne.montantCagnotte),
      commissionParrainage: Number(ligne.commissionParrainage),
      coinsParMois: ligne.coinsParMois,
      avantages: ligne.avantages,
    });
  }
}
