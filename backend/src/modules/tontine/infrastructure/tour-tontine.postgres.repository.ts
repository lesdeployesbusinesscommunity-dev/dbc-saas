import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourTontine } from '../domaine/tour-tontine';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { TourTontineOrmEntity } from './tour-tontine.orm-entity';

@Injectable()
export class TourTontinePostgresRepository implements TourTontineRepositoryPort {
  constructor(
    @InjectRepository(TourTontineOrmEntity)
    private readonly repository: Repository<TourTontineOrmEntity>,
  ) {}

  async sauvegarder(tour: TourTontine): Promise<TourTontine> {
    const ligne = await this.repository.save({
      id: tour.id,
      groupeId: tour.groupeId,
      numero: tour.numero,
      statut: tour.statut,
      beneficiaireMembreId: tour.beneficiaireMembreId,
      montant: tour.montant,
      ouvertLe: tour.ouvertLe,
      clotureLe: tour.clotureLe,
      verseLe: tour.verseLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<TourTontine | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverEnCours(groupeId: string): Promise<TourTontine | null> {
    const ligne = await this.repository.findOne({ where: { groupeId, statut: 'en_cours' } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerParGroupe(groupeId: string): Promise<TourTontine[]> {
    const lignes = await this.repository.find({ where: { groupeId }, order: { numero: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: TourTontineOrmEntity): TourTontine {
    return TourTontine.depuisPersistance({
      id: ligne.id,
      groupeId: ligne.groupeId,
      numero: ligne.numero,
      statut: ligne.statut,
      beneficiaireMembreId: ligne.beneficiaireMembreId,
      // pg renvoie les colonnes numeric en string pour ne pas perdre de précision.
      montant: Number(ligne.montant),
      ouvertLe: ligne.ouvertLe,
      clotureLe: ligne.clotureLe,
      verseLe: ligne.verseLe,
    });
  }
}
