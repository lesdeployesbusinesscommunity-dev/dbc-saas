import { CommissionMlm } from './commission-mlm';

export abstract class CommissionMlmRepositoryPort {
  abstract sauvegarderPlusieurs(commissions: CommissionMlm[]): Promise<CommissionMlm[]>;
  abstract listerParBeneficiaire(beneficiaireMembreId: string): Promise<CommissionMlm[]>;
}
