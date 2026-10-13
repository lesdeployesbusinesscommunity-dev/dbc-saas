import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Programme, StatutProgramme } from '../domaine/programme';
import { ProgrammeRepositoryPort } from '../domaine/programme.repository.port';
import { ProgrammeOrmEntity } from './programme.orm-entity';

@Injectable()
export class ProgrammePostgresRepository implements ProgrammeRepositoryPort {
  constructor(
    @InjectRepository(ProgrammeOrmEntity)
    private readonly repository: Repository<ProgrammeOrmEntity>,
  ) {}

  async listerTous(): Promise<Programme[]> {
    const lignes = await this.repository.find({ where: { code: Not(IsNull()) }, order: { id: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async listerParPilier(pilierCode: string): Promise<Programme[]> {
    const lignes = await this.repository.find({ where: { pilierCode, code: Not(IsNull()) }, order: { id: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async trouverParCode(code: string): Promise<Programme | null> {
    const ligne = await this.repository.findOne({ where: { code } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async sauvegarder(programme: Programme): Promise<Programme> {
    const ligne = await this.repository.save({
      id: programme.id,
      code: programme.code,
      pilierCode: programme.pilierCode,
      nom: programme.nom,
      niveauMinimumRequisId: programme.niveauMinimumRequisId,
      statut: programme.statut,
      visible: programme.visible,
      resume: programme.resume,
      explication: programme.explication,
      ajouteParAdmin: programme.ajouteParAdmin,
    });
    return this.versDomaine(ligne);
  }

  async supprimer(code: string): Promise<void> {
    await this.repository.delete({ code });
  }

  private versDomaine(ligne: ProgrammeOrmEntity): Programme {
    return Programme.depuisPersistance({ ...ligne, code: ligne.code!, statut: ligne.statut as StatutProgramme });
  }
}
