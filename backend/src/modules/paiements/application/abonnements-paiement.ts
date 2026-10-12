import { Injectable, Logger } from '@nestjs/common';

export type EcouteurPaiementComplete = (cleIdempotence: string) => Promise<void>;

/**
 * Permet aux modules métier (Tontine…) d'être prévenus dès qu'un paiement
 * qu'ils ont initié est complété, sans que Paiements (socle partagé) ne
 * dépende d'eux : chaque module s'abonne au préfixe de ses clés d'idempotence.
 *
 * Un écouteur en échec n'annule jamais le paiement déjà enregistré : l'erreur
 * est journalisée et le module concerné garde un moyen de rattrapage manuel.
 */
@Injectable()
export class AbonnementsPaiement {
  private readonly logger = new Logger(AbonnementsPaiement.name);
  private readonly ecouteurs: { prefixe: string; ecouteur: EcouteurPaiementComplete }[] = [];

  abonner(prefixeCleIdempotence: string, ecouteur: EcouteurPaiementComplete): void {
    this.ecouteurs.push({ prefixe: prefixeCleIdempotence, ecouteur });
  }

  async publierPaiementComplete(cleIdempotence: string): Promise<void> {
    for (const { prefixe, ecouteur } of this.ecouteurs) {
      if (!cleIdempotence.startsWith(prefixe)) {
        continue;
      }
      try {
        await ecouteur(cleIdempotence);
      } catch (erreur) {
        this.logger.error(`Écouteur du paiement ${cleIdempotence} en échec : ${(erreur as Error).message}`);
      }
    }
  }
}
