/**
 * Port (hexagonal) — génération du fichier PDF du certificat. Cahier des
 * Charges §5.1 : "Certificat PDF signé numériquement · QR code → URL de
 * vérification publique". La signature numérique du PDF n'est pas
 * implémentée (nécessiterait une infrastructure de clés/certificats
 * distincte, non spécifiée) — seul le rendu PDF + QR de vérification l'est.
 */
export interface DonneesCertificatPdf {
  matricule: string;
  formationTitre: string;
  delivreLe: Date;
  codeVerification: string;
  urlVerification: string;
}

export abstract class GenerateurCertificatPdfPort {
  abstract generer(donnees: DonneesCertificatPdf): Promise<Buffer>;
}
