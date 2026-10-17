import { mkdirSync } from 'fs';
import { resolve } from 'path';

export type TypeFichier = 'image' | 'video' | 'pdf';

const TYPES_PAR_FAMILLE: Record<TypeFichier, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf: ['application/pdf'],
};

export const TYPES_AUTORISES = Object.values(TYPES_PAR_FAMILLE).flat();

export const TAILLE_MAXIMUM_OCTETS: Record<TypeFichier, number> = {
  image: 5 * 1024 * 1024,
  pdf: 30 * 1024 * 1024,
  video: 500 * 1024 * 1024,
};

export function typeDeFichier(mimetype: string): TypeFichier {
  return (Object.keys(TYPES_PAR_FAMILLE) as TypeFichier[]).find((type) => TYPES_PAR_FAMILLE[type].includes(mimetype))!;
}

/**
 * Dossier de stockage (FICHIERS_DOSSIER, "uploads" par défaut), créé au besoin —
 * stockage définitif en local, simple transit avant envoi à R2 en production.
 * Lu directement dans l'environnement car main.ts en a besoin avant
 * l'injection de dépendances (voir useStaticAssets).
 */
export function dossierFichiers(): string {
  const dossier = resolve(process.env.FICHIERS_DOSSIER ?? 'uploads');
  mkdirSync(dossier, { recursive: true });
  return dossier;
}
