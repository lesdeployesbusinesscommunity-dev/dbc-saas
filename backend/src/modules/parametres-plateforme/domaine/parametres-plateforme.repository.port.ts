import { ParametresPlateforme } from './parametres-plateforme';

export abstract class ParametresPlateformeRepositoryPort {
  /** Les réglages enregistrés, tels quels (null si l'administrateur n'a encore rien changé). */
  abstract lire(): Promise<unknown | null>;
  abstract enregistrer(parametres: ParametresPlateforme): Promise<void>;
}
