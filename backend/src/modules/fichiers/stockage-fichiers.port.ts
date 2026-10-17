/**
 * Port de stockage des fichiers téléversés. Le fichier est d'abord écrit par
 * multer dans dossierFichiers() ; l'adaptateur le rend public et renvoie son URL.
 */
export abstract class StockageFichiersPort {
  abstract publier(fichier: { chemin: string; nom: string; mimetype: string; taille: number }): Promise<string>;
}
