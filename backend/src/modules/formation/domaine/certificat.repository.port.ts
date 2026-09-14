import { Certificat } from './certificat';

export abstract class CertificatRepositoryPort {
  abstract sauvegarder(certificat: Certificat): Promise<Certificat>;
  abstract trouverParInscriptionId(inscriptionId: string): Promise<Certificat | null>;
  abstract trouverParCodeVerification(codeVerification: string): Promise<Certificat | null>;
}
