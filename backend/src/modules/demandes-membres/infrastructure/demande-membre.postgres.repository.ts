import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandeMembre, StatutDemande, TypeDemande } from '../domaine/demande-membre';
import { DemandeMembreRepositoryPort } from '../domaine/demande-membre.repository.port';
import { DemandeMembreOrmEntity } from './demande-membre.orm-entity';

@Injectable()
export class DemandeMembrePostgresRepository implements DemandeMembreRepositoryPort {
  constructor(
    @InjectRepository(DemandeMembreOrmEntity)
    private readonly repository: Repository<DemandeMembreOrmEntity>,
  ) {}

  async sauvegarder(demande: DemandeMembre): Promise<DemandeMembre> {
    const ligne = await this.repository.save({
      id: demande.id,
      membreId: demande.membreId,
      type: demande.type,
      details: demande.details,
      profil: demande.profil,
      statut: demande.statut,
      creeLe: demande.creeLe,
      decideLe: demande.decideLe,
      lueParAdmin: demande.lueParAdmin,
      decisionLueParMembre: demande.decisionLueParMembre,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<DemandeMembre | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerToutes(): Promise<DemandeMembre[]> {
    const lignes = await this.repository.find({ order: { creeLe: 'DESC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async listerParMembre(membreId: string): Promise<DemandeMembre[]> {
    const lignes = await this.repository.find({ where: { membreId }, order: { creeLe: 'DESC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: DemandeMembreOrmEntity): DemandeMembre {
    return DemandeMembre.depuisPersistance({
      ...ligne,
      type: ligne.type as TypeDemande,
      statut: ligne.statut as StatutDemande,
    });
  }
}
