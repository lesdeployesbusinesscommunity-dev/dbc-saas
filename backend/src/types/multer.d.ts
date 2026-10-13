/**
 * Déclaration minimale de "multer" (fourni par @nestjs/platform-express, sans
 * ses types) : seul diskStorage est utilisé — voir FichiersController.
 */
declare module 'multer' {
  interface FichierRecu {
    originalname: string;
    mimetype: string;
  }

  type Rappel = (erreur: Error | null, valeur: string) => void;

  interface OptionsStockageDisque {
    destination: (requete: unknown, fichier: FichierRecu, rappel: Rappel) => void;
    filename: (requete: unknown, fichier: FichierRecu, rappel: Rappel) => void;
  }

  export function diskStorage(options: OptionsStockageDisque): unknown;
}
