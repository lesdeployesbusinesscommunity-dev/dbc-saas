/**
 * Entité de domaine pure — Cahier des Charges §5.1 : "Certificat PDF signé
 * numériquement · QR code → URL de vérification publique". Le rendu PDF et
 * l'image QR sont des préoccupations de présentation (hors domaine) ; cette
 * entité porte le fait métier vérifiable : un code de vérification unique,
 * consultable via une URL publique (voir FormationController).
 */
export class Certificat {
  private constructor(
    public readonly id: string | undefined,
    public readonly inscriptionId: string,
    public readonly codeVerification: string,
    public readonly delivreLe: Date,
  ) {}

  static creer(params: { inscriptionId: string; codeVerification: string }): Certificat {
    return new Certificat(undefined, params.inscriptionId, params.codeVerification, new Date());
  }

  static depuisPersistance(donnees: {
    id: string;
    inscriptionId: string;
    codeVerification: string;
    delivreLe: Date;
  }): Certificat {
    return new Certificat(donnees.id, donnees.inscriptionId, donnees.codeVerification, donnees.delivreLe);
  }
}
