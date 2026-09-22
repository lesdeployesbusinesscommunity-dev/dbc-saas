import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionCoins } from '../domaine/transaction-coins';
import { LigneClassement, TransactionCoinsRepositoryPort } from '../domaine/transaction-coins.repository.port';
import { TransactionCoinsOrmEntity } from './transaction-coins.orm-entity';

@Injectable()
export class TransactionCoinsPostgresRepository implements TransactionCoinsRepositoryPort {
  constructor(
    @InjectRepository(TransactionCoinsOrmEntity)
    private readonly repository: Repository<TransactionCoinsOrmEntity>,
  ) {}

  async sauvegarder(transaction: TransactionCoins): Promise<TransactionCoins> {
    const ligne = await this.repository.save({
      id: transaction.id,
      membreId: transaction.membreId,
      delta: transaction.delta,
      soldeApres: transaction.soldeApres,
      motif: transaction.motif,
      cleIdempotence: transaction.cleIdempotence,
    });
    return this.versDomaine(ligne);
  }

  async trouverParCleIdempotence(cleIdempotence: string): Promise<TransactionCoins | null> {
    const ligne = await this.repository.findOne({ where: { cleIdempotence } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async dernierSolde(membreId: string): Promise<number> {
    const ligne = await this.repository.findOne({ where: { membreId }, order: { creeLe: 'DESC' } });
    return ligne?.soldeApres ?? 0;
  }

  async listerParMembre(membreId: string): Promise<TransactionCoins[]> {
    const lignes = await this.repository.find({ where: { membreId }, order: { creeLe: 'DESC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async classement(limite: number): Promise<LigneClassement[]> {
    const lignes: { membre_id: string; solde: number }[] = await this.repository.manager.query(
      `SELECT DISTINCT ON (membre_id) membre_id, solde_apres AS solde
       FROM transactions_coins
       ORDER BY membre_id, cree_le DESC`,
    );
    return lignes
      .sort((a, b) => b.solde - a.solde)
      .slice(0, limite)
      .map((ligne) => ({ membreId: ligne.membre_id, solde: Number(ligne.solde) }));
  }

  private versDomaine(ligne: TransactionCoinsOrmEntity): TransactionCoins {
    return TransactionCoins.depuisPersistance({
      id: ligne.id,
      membreId: ligne.membreId,
      delta: ligne.delta,
      soldeApres: ligne.soldeApres,
      motif: ligne.motif,
      cleIdempotence: ligne.cleIdempotence,
    });
  }
}
