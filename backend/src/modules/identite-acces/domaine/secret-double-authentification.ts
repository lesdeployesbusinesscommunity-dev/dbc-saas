/**
 * Entité de domaine pure. Reflète "SecretDoubleAuthentification" du cahier de
 * conception, module 1 — agrégée 0..1 par Utilisateur : indique si la double
 * authentification (OTP WhatsApp) est activée pour ce compte.
 */
export class SecretDoubleAuthentification {
  private constructor(
    public readonly id: string | undefined,
    public readonly utilisateurId: string,
    public actif: boolean,
  ) {}

  static creerDesactive(utilisateurId: string): SecretDoubleAuthentification {
    return new SecretDoubleAuthentification(undefined, utilisateurId, false);
  }

  static depuisPersistance(donnees: { id: string; utilisateurId: string; actif: boolean }): SecretDoubleAuthentification {
    return new SecretDoubleAuthentification(donnees.id, donnees.utilisateurId, donnees.actif);
  }

  activer(): void {
    this.actif = true;
  }

  desactiver(): void {
    this.actif = false;
  }
}
