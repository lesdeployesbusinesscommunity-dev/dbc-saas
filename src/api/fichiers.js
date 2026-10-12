// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// POST /fichiers — téléverse une image, une vidéo ou un PDF (photo, affiche,
// vidéo ou support de formation...) et renvoie { url, type, name, size } :
// l'URL publique du fichier, à enregistrer ensuite avec la donnée concernée.
// Pas de délai maximum ici : une vidéo peut être longue à envoyer.
export async function televerserFichier(file, { onProgress } = {}) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await httpClient.post("/fichiers", body, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
    onUploadProgress: onProgress
      ? (event) => onProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)
      : undefined,
  });
  return data;
}
