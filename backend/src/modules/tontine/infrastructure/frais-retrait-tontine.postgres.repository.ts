import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraisRetraitTontine } from '../domaine/frais-retrait-tontine';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { FraisRetraitTontineOrmEntity } from './frais-retrait-tontine.orm-entity';

@Injectable()
export class FraisRetraitTontinePostgresRepository implements FraisRetraitTontineRepositoryPort {
  constructor(
    @InjectRepository(FraisRetraitTontineOrmEntity)
    private readonly repository: Repository<FraisRetraitTontineOrmEntity>,
  ) {}

  async sauvegarder(frais: FraisRetraitTontine): Promise<FraisRetraitTontine> {
    const ligne = await this.repository.save({ niveauId: frais.niveauId, montant: frais.montant });
    return this.versDomaine(ligne);
  }

  async trouverParNiveau(niveauId: number): Promise<FraisRetraitTontine | null> {
    const ligne = await this.repository.findOne({ where: { niveauId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerTous(): Promise<FraisRetraitTontine[]> {
    const lignes = await this.repository.find({ order: { niveauId: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: FraisRetraitTontineOrmEntity): FraisRetraitTontine {
    // pg renvoie les colonnes numeric en string pour ne pas perdre de précision.
    return FraisRetraitTontine.depuisPersistance({ niveauId: ligne.niveauId, montant: Number(ligne.montant) });
  }
}
