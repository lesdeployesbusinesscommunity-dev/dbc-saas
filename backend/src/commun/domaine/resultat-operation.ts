/**
 * Type Résultat partagé — utilisé par toutes les entités de domaine pour
 * signaler une violation de règle métier sans lever d'exception. Extrait
 * du module Identité & Accès pour être réutilisé par les autres modules
 * (ex. Paiements) sans duplication.
 */
export class ResultatOperation<T = void> {
  private constructor(
    public readonly succes: boolean,
    public readonly valeur?: T,
    public readonly erreur?: string,
  ) {}
  static ok<T>(valeur?: T) {
    return new ResultatOperation<T>(true, valeur);
  }
  static echec<T>(erreur: string) {
    return new ResultatOperation<T>(false, undefined, erreur);
  }
}
