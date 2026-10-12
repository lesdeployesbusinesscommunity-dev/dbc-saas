import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscriptionAttenteTontine } from '../domaine/inscription-attente-tontine';
import { InscriptionAttenteTontineRepositoryPort } from '../domaine/inscription-attente-tontine.repository.port';
import { InscriptionAttenteTontineOrmEntity } from './inscription-attente-tontine.orm-entity';

@Injectable()
export class InscriptionAttenteTontinePostgresRepository implements InscriptionAttenteTontineRepositoryPort {
  constructor(
    @InjectRepository(InscriptionAttenteTontineOrmEntity)
    private readonly repository: Repository<InscriptionAttenteTontineOrmEntity>,
  ) {}

  async sauvegarder(inscription: InscriptionAttenteTontine): Promise<InscriptionAttenteTontine> {
    const ligne = await this.repository.save({
      id: inscription.id,
      membreId: inscription.membreId,
      niveauId: inscription.niveauId,
      statut: inscription.statut,
      groupeId: inscription.groupeId,
      inscritLe: inscription.inscritLe,
    });
    return this.versDomaine(ligne);
  }

  async listerEnAttente(niveauId?: number): Promise<InscriptionAttenteTontine[]> {
    const lignes = await this.repository.find({
      where: niveauId === undefined ? { statut: 'en_attente' } : { statut: 'en_attente', niveauId },
      order: { inscritLe: 'ASC' },
    });
    return lignes.map((l) => this.versDomaine(l));
  }

  async trouverEnAttentePourMembre(membreId: string): Promise<InscriptionAttenteTontine | null> {
    const ligne = await this.repository.findOne({ where: { membreId, statut: 'en_attente' } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: InscriptionAttenteTontineOrmEntity): InscriptionAttenteTontine {
    return InscriptionAttenteTontine.depuisPersistance({
      id: ligne.id,
      membreId: ligne.membreId,
      niveauId: ligne.niveauId,
      statut: ligne.statut,
      groupeId: ligne.groupeId,
      inscritLe: ligne.inscritLe,
    });
  }
}
