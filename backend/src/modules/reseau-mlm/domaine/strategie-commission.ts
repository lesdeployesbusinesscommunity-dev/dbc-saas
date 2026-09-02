/**
 * Patron Stratégie (cahier de conception, module 5) : chaque type de
 * commission est isolé dans sa propre classe. StrategiePerformance
 * (profondeur 2 et 3, taux dégressifs) n'est PAS implémentée — les taux ne
 * sont spécifiés nulle part dans les documents disponibles (voir mémoire
 * "Packs Longrich réels"). Seule la commission de parrainage direct
 * (profondeur 1) est calculable avec les données réelles qu'on a.
 */
export interface ContexteCommission {
  profondeur: number;
  commissionNiveau: number;
}

export abstract class StrategieCommission {
  /** Retourne null si cette stratégie ne s'applique pas à ce contexte. */
  abstract calculer(contexte: ContexteCommission): number | null;
}

export class StrategieParrainageDirect extends StrategieCommission {
  calculer(contexte: ContexteCommission): number | null {
    if (contexte.profondeur !== 1) {
      return null;
    }
    return contexte.commissionNiveau;
  }
}
