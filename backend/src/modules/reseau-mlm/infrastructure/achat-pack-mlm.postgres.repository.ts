import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchatPackMlm } from '../domaine/achat-pack-mlm';
import { AchatPackMlmRepositoryPort } from '../domaine/achat-pack-mlm.repository.port';
import { AchatPackMlmOrmEntity } from './achat-pack-mlm.orm-entity';

@Injectable()
export class AchatPackMlmPostgresRepository implements AchatPackMlmRepositoryPort {
  constructor(
    @InjectRepository(AchatPackMlmOrmEntity)
    private readonly repository: Repository<AchatPackMlmOrmEntity>,
  ) {}

  async sauvegarder(achat: AchatPackMlm): Promise<AchatPackMlm> {
    const ligne = await this.repository.save({
      id: achat.id,
      membreId: achat.membreId,
      packId: achat.packId,
      cleIdempotencePaiement: achat.cleIdempotencePaiement,
      statut: achat.statut,
      acheteLe: achat.acheteLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<AchatPackMlm | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: AchatPackMlmOrmEntity): AchatPackMlm {
    return AchatPackMlm.depuisPersistance({
      id: ligne.id,
      membreId: ligne.membreId,
      packId: ligne.packId,
      cleIdempotencePaiement: ligne.cleIdempotencePaiement,
      statut: ligne.statut,
      acheteLe: ligne.acheteLe,
    });
  }
}
