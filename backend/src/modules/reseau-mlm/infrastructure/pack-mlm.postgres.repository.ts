import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackMlm } from '../domaine/pack-mlm';
import { PackMlmRepositoryPort } from '../domaine/pack-mlm.repository.port';
import { PackMlmOrmEntity } from './pack-mlm.orm-entity';

@Injectable()
export class PackMlmPostgresRepository implements PackMlmRepositoryPort {
  constructor(
    @InjectRepository(PackMlmOrmEntity)
    private readonly repository: Repository<PackMlmOrmEntity>,
  ) {}

  async trouverParCode(code: string): Promise<PackMlm | null> {
    const ligne = await this.repository.findOne({ where: { code } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParId(id: number): Promise<PackMlm | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerTous(): Promise<PackMlm[]> {
    const lignes = await this.repository.find({ order: { id: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: PackMlmOrmEntity): PackMlm {
    return PackMlm.depuisPersistance({
      id: ligne.id,
      code: ligne.code,
      nom: ligne.nom,
      prix: Number(ligne.prix),
      pointsPv: ligne.pointsPv,
      niveauRequisCode: ligne.niveauRequisCode,
      typeGains: ligne.typeGains,
    });
  }
}
