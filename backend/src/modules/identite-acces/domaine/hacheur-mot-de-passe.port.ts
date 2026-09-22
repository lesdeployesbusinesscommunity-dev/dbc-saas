/**
 * Port (interface) défini par le domaine pour le hachage des mots de passe.
 * L'infrastructure fournit l'implémentation concrète (bcrypt, argon2...).
 */
export abstract class HacheurMotDePassePort {
  abstract hacher(motDePasseClair: string): Promise<string>;
  abstract verifier(motDePasseClair: string, hache: string): Promise<boolean>;
}
