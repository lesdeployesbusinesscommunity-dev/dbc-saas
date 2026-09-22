/**
 * Entité de domaine pure. Un siège appartient à un pôle (Pole.id) et peut
 * être vacant (membreId null) ou occupé par un membre.
 */
export class Siege {
  private constructor(
    public readonly id: string,
    public readonly poleId: number,
    public readonly titre: string,
    public readonly ordre: number,
    public membreId: string | null,
  ) {}

  static depuisPersistance(donnees: {
    id: string;
    poleId: number;
    titre: string;
    ordre: number;
    membreId: string | null;
  }): Siege {
    return new Siege(donnees.id, donnees.poleId, donnees.titre, donnees.ordre, donnees.membreId);
  }

  assigner(membreId: string): void {
    this.membreId = membreId;
  }

  liberer(): void {
    this.membreId = null;
  }
}
