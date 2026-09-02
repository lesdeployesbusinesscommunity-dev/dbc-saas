import { SecretDoubleAuthentification } from './secret-double-authentification';

export abstract class SecretDoubleAuthentificationRepositoryPort {
  abstract sauvegarder(secret: SecretDoubleAuthentification): Promise<SecretDoubleAuthentification>;
  abstract trouverParUtilisateurId(utilisateurId: string): Promise<SecretDoubleAuthentification | null>;
}
