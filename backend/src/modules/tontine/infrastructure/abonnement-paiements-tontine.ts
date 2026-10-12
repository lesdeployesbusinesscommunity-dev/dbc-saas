import { Injectable, OnModuleInit } from '@nestjs/common';
import { PREFIXE_CLE_PAIEMENT_COTISATION } from '../domaine/cotisation-tontine';
import { ConfirmerCotisationUseCase } from '../application/confirmer-cotisation.use-case';
import { AbonnementsPaiement } from '../../paiements/application/abonnements-paiement';

/**
 * Branche la Tontine sur le callback Mobile Money : dès qu'un paiement de
 * cotisation est complété, la cotisation est confirmée, le responsable
 * notifié et les cagnottes attribuées — sans intervention de l'administrateur.
 */
@Injectable()
export class AbonnementPaiementsTontine implements OnModuleInit {
  constructor(
    private readonly abonnements: AbonnementsPaiement,
    private readonly confirmerCotisation: ConfirmerCotisationUseCase,
  ) {}

  onModuleInit(): void {
    this.abonnements.abonner(PREFIXE_CLE_PAIEMENT_COTISATION, async (cleIdempotence) => {
      await this.confirmerCotisation.executer({ cleIdempotencePaiement: cleIdempotence });
    });
  }
}
