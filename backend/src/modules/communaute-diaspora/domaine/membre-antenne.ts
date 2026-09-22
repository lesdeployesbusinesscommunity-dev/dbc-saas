/**
 * Entité de domaine pure. Reflète "MembreAntenne" du cahier de conception,
 * module 9 — un membre rattaché à une antenne.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';
import { Antenne } from './antenne';

export class MembreAntenne {
  private constructor(
    public readonly id: string | undefined,
    public readonly antenneId: string,
    public readonly membreId: string,
  ) {}

  static rejoindre(antenne: Antenne, membreId: string): ResultatOperation<MembreAntenne> {
    if (!antenne.estOuverte()) {
      return ResultatOperation.echec('Cette antenne n’est pas encore ouverte');
    }
    return ResultatOperation.ok(new MembreAntenne(undefined, antenne.id!, membreId));
  }

  static depuisPersistance(donnees: { id: string; antenneId: string; membreId: string }): MembreAntenne {
    return new MembreAntenne(donnees.id, donnees.antenneId, donnees.membreId);
  }
}
