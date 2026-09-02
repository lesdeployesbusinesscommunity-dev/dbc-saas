import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionMlm } from '../domaine/commission-mlm';
import { CommissionMlmRepositoryPort } from '../domaine/commission-mlm.repository.port';
import { CommissionMlmOrmEntity } from './commission-mlm.orm-entity';

@Injectable()
export class CommissionMlmPostgresRepository implements CommissionMlmRepositoryPort {
  constructor(
    @InjectRepository(CommissionMlmOrmEntity)
    private readonly repository: Repository<CommissionMlmOrmEntity>,
  ) {}

  async sauvegarderPlusieurs(commissions: CommissionMlm[]): Promise<CommissionMlm[]> {
    const lignes = await this.repository.save(
      commissions.map((commission) => ({
        id: commission.id,
        achatId: commission.achatId,
        beneficiaireMembreId: commission.beneficiaireMembreId,
        montant: commission.montant,
        profondeurNiveau: commission.profondeurNiveau,
        statut: commission.statut,
      })),
    );
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  async listerParBeneficiaire(beneficiaireMembreId: string): Promise<CommissionMlm[]> {
    const lignes = await this.repository.find({ where: { beneficiaireMembreId } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: CommissionMlmOrmEntity): CommissionMlm {
    return CommissionMlm.depuisPersistance({
      id: ligne.id,
      achatId: ligne.achatId,
      beneficiaireMembreId: ligne.beneficiaireMembreId,
      montant: Number(ligne.montant),
      profondeurNiveau: ligne.profondeurNiveau,
      statut: ligne.statut,
    });
  }
}
