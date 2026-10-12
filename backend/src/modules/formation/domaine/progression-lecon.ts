/**
 * Entité de domaine pure. Reflète "ProgressionLecon" du cahier de
 * conception, module 7 (LMS) — suivi de complétion d'une Leçon pour une
 * Inscription donnée. Pour une leçon de type quiz, garde aussi le meilleur
 * score et le nombre de tentatives ; elle n'est terminée qu'une fois réussie.
 */
export class ProgressionLecon {
  private constructor(
    public readonly id: string | undefined,
    public readonly inscriptionId: string,
    public readonly leconId: string,
    public terminee: boolean,
    public termineeLe: Date | null,
    public meilleurScore: number | null,
    public tentatives: number,
  ) {}

  static creer(params: { inscriptionId: string; leconId: string }): ProgressionLecon {
    return new ProgressionLecon(undefined, params.inscriptionId, params.leconId, false, null, null, 0);
  }

  static depuisPersistance(donnees: {
    id: string;
    inscriptionId: string;
    leconId: string;
    terminee: boolean;
    termineeLe: Date | null;
    meilleurScore: number | null;
    tentatives: number;
  }): ProgressionLecon {
    return new ProgressionLecon(
      donnees.id,
      donnees.inscriptionId,
      donnees.leconId,
      donnees.terminee,
      donnees.termineeLe,
      donnees.meilleurScore,
      donnees.tentatives,
    );
  }

  marquerTerminee(): void {
    if (!this.terminee) {
      this.terminee = true;
      this.termineeLe = new Date();
    }
  }

  enregistrerTentativeQuiz(pourcentage: number, reussi: boolean): void {
    this.tentatives += 1;
    this.meilleurScore = Math.max(this.meilleurScore ?? 0, pourcentage);
    if (reussi) {
      this.marquerTerminee();
    }
  }
}
