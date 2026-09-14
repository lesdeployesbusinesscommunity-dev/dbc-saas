import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscription } from '../domaine/inscription';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { InscriptionOrmEntity } from './inscription.orm-entity';

@Injectable()
export class InscriptionPostgresRepository implements InscriptionRepositoryPort {
  constructor(
    @InjectRepository(InscriptionOrmEntity)
    private readonly repository: Repository<InscriptionOrmEntity>,
  ) {}

  async sauvegarder(inscription: Inscription): Promise<Inscription> {
    const ligne = await this.repository.save({
      id: inscription.id,
      membreId: inscription.membreId,
      formationId: inscription.formationId,
      statut: inscription.statut,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<Inscription | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParMembreEtFormation(membreId: string, formationId: string): Promise<Inscription | null> {
    const ligne = await this.repository.findOne({ where: { membreId, formationId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: InscriptionOrmEntity): Inscription {
    return Inscription.depuisPersistance({
      id: ligne.id,
      membreId: ligne.membreId,
      formationId: ligne.formationId,
      statut: ligne.statut,
    });
  }
}
