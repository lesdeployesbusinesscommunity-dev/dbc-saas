/** Entité de domaine pure. Reflète "Zone" du cahier de conception, module 9. */
export class Zone {
  private constructor(
    public readonly id: number,
    public readonly nom: string,
    public readonly type: string,
  ) {}

  static depuisPersistance(donnees: { id: number; nom: string; type: string }): Zone {
    return new Zone(donnees.id, donnees.nom, donnees.type);
  }
}
