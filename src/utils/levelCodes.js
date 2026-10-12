// ----------------------------------------------------------------------

// Les niveaux DBC ont une "key" côté frontend (Simulateur/data.js, en
// camelCase) et un "code" côté backend (GET /adhesion/niveaux, en
// snake_case). Trois niveaux sur 8 diffèrent : la correspondance vit ici,
// une seule fois, pour toutes les pages qui parlent à l'API.
export const LEVEL_CODE_BY_KEY = {
  starter: "starter",
  batisseur: "batisseur",
  batisseurPro: "batisseur_pro",
  performer: "performer",
  performerPro: "performer_pro",
  stratege: "strategie",
  elite: "elite",
  legende: "legende",
};

export const LEVEL_KEY_BY_CODE = Object.fromEntries(
  Object.entries(LEVEL_CODE_BY_KEY).map(([key, code]) => [code, key]),
);

export function levelKeyFromCode(code) {
  return LEVEL_KEY_BY_CODE[code] ?? code;
}
