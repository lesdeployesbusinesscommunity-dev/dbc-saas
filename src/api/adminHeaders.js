// ----------------------------------------------------------------------

// Le back-office (/admin) est protege cote backend par un header partage
// x-admin-secret (AdminSecretGuard), en attendant un vrai systeme de roles
// (voir le commentaire sur ce garde cote backend). Ce n'est PAS une
// authentification securisee au sens habituel : quiconque connait le
// secret peut appeler ces routes, et le stocker cote navigateur (meme en
// localStorage, jamais dans le bundle/.env expose) l'expose a qui a acces
// au poste. A remplacer des qu'un vrai systeme de roles existe cote API.

const ADMIN_SECRET_STORAGE_KEY = "adminSecret";

export function getAdminSecret() {
  return window.localStorage.getItem(ADMIN_SECRET_STORAGE_KEY);
}

export function setAdminSecret(secret) {
  if (typeof secret === "string" && secret.trim() !== "") {
    window.localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
  } else {
    window.localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
  }
}

export function clearAdminSecret() {
  window.localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
}

// A passer en options (2e argument) d'un appel httpClient admin :
// httpClient.get("/membres", { headers: adminHeaders() })
export function adminHeaders() {
  return { "x-admin-secret": getAdminSecret() ?? "" };
}
