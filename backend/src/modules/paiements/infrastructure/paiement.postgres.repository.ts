import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paiement } from '../domaine/paiement';
import { PaiementRepositoryPort } from '../domaine/paiement.repository.port';
import { PaiementOrmEntity } from './paiement.orm-entity';

@Injectable()
export class PaiementPostgresRepository implements PaiementRepositoryPort {
  constructor(
    @InjectRepository(PaiementOrmEntity)
    private readonly repository: Repository<PaiementOrmEntity>,
  ) {}

  async sauvegarder(paiement: Paiement): Promise<Paiement> {
    const ligne = await this.repository.save({
      id: paiement.id,
      montant: paiement.montant,
      objet: paiement.objet,
      cleIdempotence: paiement.cleIdempotence,
      statut: paiement.statut,
    });
    return this.versDomaine(ligne);
  }

  async trouverParCleIdempotence(cleIdempotence: string): Promise<Paiement | null> {
    const ligne = await this.repository.findOne({ where: { cleIdempotence } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: PaiementOrmEntity): Paiement {
    return Paiement.depuisPersistance({
      id: ligne.id,
      // pg renvoie les colonnes numeric en string pour ne pas perdre de précision.
      montant: Number(ligne.montant),
      objet: ligne.objet,
      cleIdempotence: ligne.cleIdempotence,
      statut: ligne.statut,
    });
  }
}
