import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferencesMembre } from '../domaine/preferences-membre';
import { PreferencesMembreRepositoryPort } from '../domaine/preferences-membre.repository.port';
import { PreferencesMembreOrmEntity } from './preferences-membre.orm-entity';

@Injectable()
export class PreferencesMembrePostgresRepository implements PreferencesMembreRepositoryPort {
  constructor(
    @InjectRepository(PreferencesMembreOrmEntity)
    private readonly repository: Repository<PreferencesMembreOrmEntity>,
  ) {}

  async lire(membreId: string): Promise<unknown | null> {
    const ligne = await this.repository.findOne({ where: { membreId } });
    return ligne?.valeur ?? null;
  }

  async listerToutes(): Promise<Map<string, unknown>> {
    const lignes = await this.repository.find();
    return new Map(lignes.map((ligne) => [ligne.membreId, ligne.valeur]));
  }

  async enregistrer(membreId: string, preferences: PreferencesMembre): Promise<void> {
    await this.repository.save({ membreId, valeur: preferences as unknown as Record<string, unknown> });
  }
}
