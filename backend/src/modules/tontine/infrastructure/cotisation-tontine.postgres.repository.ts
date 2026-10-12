import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CotisationTontine } from '../domaine/cotisation-tontine';
import { CotisationTontineRepositoryPort } from '../domaine/cotisation-tontine.repository.port';
import { CotisationTontineOrmEntity } from './cotisation-tontine.orm-entity';

@Injectable()
export class CotisationTontinePostgresRepository implements CotisationTontineRepositoryPort {
  constructor(
    @InjectRepository(CotisationTontineOrmEntity)
    private readonly repository: Repository<CotisationTontineOrmEntity>,
  ) {}

  async sauvegarder(cotisation: CotisationTontine): Promise<CotisationTontine> {
    const ligne = await this.repository.save({
      id: cotisation.id,
      participationId: cotisation.participationId,
      groupeId: cotisation.groupeId,
      membreId: cotisation.membreId,
      numero: cotisation.numero,
      montant: cotisation.montant,
      fraisRetrait: cotisation.fraisRetrait,
      cleIdempotencePaiement: cotisation.cleIdempotencePaiement,
      statut: cotisation.statut,
      payeeLe: cotisation.payeeLe,
      enRetard: cotisation.enRetard,
      creeLe: cotisation.creeLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<CotisationTontine | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParCleIdempotence(cleIdempotencePaiement: string): Promise<CotisationTontine | null> {
    const ligne = await this.repository.findOne({ where: { cleIdempotencePaiement } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerParParticipation(participationId: string): Promise<CotisationTontine[]> {
    const lignes = await this.repository.find({ where: { participationId }, order: { numero: 'ASC', creeLe: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  async listerParGroupe(groupeId: string): Promise<CotisationTontine[]> {
    const lignes = await this.repository.find({ where: { groupeId }, order: { creeLe: 'ASC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: CotisationTontineOrmEntity): CotisationTontine {
    return CotisationTontine.depuisPersistance({
      id: ligne.id,
      participationId: ligne.participationId,
      groupeId: ligne.groupeId,
      membreId: ligne.membreId,
      numero: ligne.numero,
      // pg renvoie les colonnes numeric en string pour ne pas perdre de précision.
      montant: Number(ligne.montant),
      fraisRetrait: Number(ligne.fraisRetrait),
      cleIdempotencePaiement: ligne.cleIdempotencePaiement,
      statut: ligne.statut,
      payeeLe: ligne.payeeLe,
      enRetard: ligne.enRetard,
      creeLe: ligne.creeLe,
    });
  }
}
