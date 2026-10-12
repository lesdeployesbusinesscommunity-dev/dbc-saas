/**
 * Entité de domaine pure. Un siège appartient à un pôle (Pole.id) et peut
 * être vacant (membreId null) ou occupé par un membre.
 */
export class Siege {
  private constructor(
    public readonly id: string | undefined,
    public readonly poleId: number,
    public titre: string,
    public ordre: number,
    public membreId: string | null,
  ) {}

  static creer(params: { poleId: number; titre: string; ordre: number }): Siege {
    return new Siege(undefined, params.poleId, params.titre, params.ordre, null);
  }

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

  renommer(titre: string): void {
    this.titre = titre;
  }
}
