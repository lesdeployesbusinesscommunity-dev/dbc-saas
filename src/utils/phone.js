// Le backend valide les numéros avec /^\+?[0-9]{8,15}$/ (voir Utilisateur.creer
// côté NestJS) : ni espace, ni tiret, ni parenthèse. On nettoie la saisie
// utilisateur ("+225 07 12 34 56 78") avant de l'envoyer, plutôt que de
// rejeter une saisie humaine parfaitement lisible.
export function normalizePhoneNumber(value) {
  return value.trim().replace(/[^\d+]/g, "");
}
