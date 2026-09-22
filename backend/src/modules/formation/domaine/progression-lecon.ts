/**
 * Entité de domaine pure. Reflète "ProgressionLecon" du cahier de
 * conception, module 7 (LMS) — suivi de complétion d'une Leçon pour une
 * Inscription donnée.
 */
export class ProgressionLecon {
  private constructor(
    public readonly id: string | undefined,
    public readonly inscriptionId: string,
    public readonly leconId: string,
    public terminee: boolean,
    public termineeLe: Date | null,
  ) {}

  static creer(params: { inscriptionId: string; leconId: string }): ProgressionLecon {
    return new ProgressionLecon(undefined, params.inscriptionId, params.leconId, false, null);
  }

  static depuisPersistance(donnees: {
    id: string;
    inscriptionId: string;
    leconId: string;
    terminee: boolean;
    termineeLe: Date | null;
  }): ProgressionLecon {
    return new ProgressionLecon(donnees.id, donnees.inscriptionId, donnees.leconId, donnees.terminee, donnees.termineeLe);
  }

  marquerTerminee(): void {
    this.terminee = true;
    this.termineeLe = new Date();
  }
}
