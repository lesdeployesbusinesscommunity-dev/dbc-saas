import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from '../domaine/formation';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { FormationOrmEntity } from './formation.orm-entity';

@Injectable()
export class FormationPostgresRepository implements FormationRepositoryPort {
  constructor(
    @InjectRepository(FormationOrmEntity)
    private readonly repository: Repository<FormationOrmEntity>,
  ) {}

  async sauvegarder(formation: Formation): Promise<Formation> {
    const ligne = await this.repository.save({
      id: formation.id,
      code: formation.code,
      titre: formation.titre,
      niveauRequisId: formation.niveauRequisId,
      pilierCode: formation.pilierCode,
    });
    return this.versDomaine(ligne);
  }

  async listerToutes(): Promise<Formation[]> {
    const lignes = await this.repository.find();
    return lignes.map((l) => this.versDomaine(l));
  }

  async trouverParId(id: string): Promise<Formation | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: FormationOrmEntity): Formation {
    return Formation.depuisPersistance({
      id: ligne.id,
      code: ligne.code,
      titre: ligne.titre,
      niveauRequisId: ligne.niveauRequisId,
      pilierCode: ligne.pilierCode,
    });
  }
}
