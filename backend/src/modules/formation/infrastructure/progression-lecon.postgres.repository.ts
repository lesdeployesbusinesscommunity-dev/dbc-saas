import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressionLecon } from '../domaine/progression-lecon';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { ProgressionLeconOrmEntity } from './progression-lecon.orm-entity';

@Injectable()
export class ProgressionLeconPostgresRepository implements ProgressionLeconRepositoryPort {
  constructor(
    @InjectRepository(ProgressionLeconOrmEntity)
    private readonly repository: Repository<ProgressionLeconOrmEntity>,
  ) {}

  async sauvegarder(progression: ProgressionLecon): Promise<ProgressionLecon> {
    const ligne = await this.repository.save({
      id: progression.id,
      inscriptionId: progression.inscriptionId,
      leconId: progression.leconId,
      terminee: progression.terminee,
      termineeLe: progression.termineeLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParInscriptionEtLecon(inscriptionId: string, leconId: string): Promise<ProgressionLecon | null> {
    const ligne = await this.repository.findOne({ where: { inscriptionId, leconId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerParInscriptionId(inscriptionId: string): Promise<ProgressionLecon[]> {
    const lignes = await this.repository.find({ where: { inscriptionId } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: ProgressionLeconOrmEntity): ProgressionLecon {
    return ProgressionLecon.depuisPersistance({
      id: ligne.id,
      inscriptionId: ligne.inscriptionId,
      leconId: ligne.leconId,
      terminee: ligne.terminee,
      termineeLe: ligne.termineeLe,
    });
  }
}
