import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { ParticipationTontineOrmEntity } from './participation-tontine.orm-entity';

@Injectable()
export class ParticipationTontinePostgresRepository implements ParticipationTontineRepositoryPort {
  constructor(
    @InjectRepository(ParticipationTontineOrmEntity)
    private readonly repository: Repository<ParticipationTontineOrmEntity>,
  ) {}

  async sauvegarder(participation: ParticipationTontine): Promise<ParticipationTontine> {
    const ligne = await this.repository.save({
      id: participation.id,
      groupeId: participation.groupeId,
      membreId: participation.membreId,
      rang: participation.rang,
      rejointLe: participation.rejointLe,
      beneficiaireLe: participation.beneficiaireLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<ParticipationTontine | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerParGroupe(groupeId: string): Promise<ParticipationTontine[]> {
    const lignes = await this.repository.find({ where: { groupeId }, order: { rang: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  async listerParMembre(membreId: string): Promise<ParticipationTontine[]> {
    const lignes = await this.repository.find({ where: { membreId }, order: { rejointLe: 'DESC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: ParticipationTontineOrmEntity): ParticipationTontine {
    return ParticipationTontine.depuisPersistance({
      id: ligne.id,
      groupeId: ligne.groupeId,
      membreId: ligne.membreId,
      rang: ligne.rang,
      rejointLe: ligne.rejointLe,
      beneficiaireLe: ligne.beneficiaireLe,
    });
  }
}
