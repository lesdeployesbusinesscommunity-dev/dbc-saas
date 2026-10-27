// ----------------------------------------------------------------------
// Les règles d'un groupe de tontine DBC, communes à l'espace membre (Ma
// Tontine), à l'administration (Gestion des tontines) et à l'espace leader :
//   - un groupe réunit 36 personnes ;
//   - le cycle dure 12 mois (un "tour" par mois) ;
//   - chaque mois, 3 personnes reçoivent la cagnotte (36 ÷ 12) : chacune la
//     reçoit donc UNE fois par cycle ;
//   - tout le monde cotise chaque mois, et la cagnotte de chaque bénéficiaire
//     est celle de son niveau (Simulateur/data.js : "cagnotte").
export const GROUP_SIZE = 36;
export const TOTAL_TOURS = 12;
export const PER_TOUR = GROUP_SIZE / TOTAL_TOURS;

// Le tour (1 à 12) auquel passe la personne placée à cette position (0 à 35)
// dans l'ordre de passage : les 3 premières au tour 1, les 3 suivantes au
// tour 2, etc.
export const tourOfPosition = (position, perTour = PER_TOUR) => Math.floor(position / perTour) + 1;

// ----------------------------------------------------------------------
// Des noms de démonstration pour remplir les groupes. Aucun ne reprend un
// membre déjà présent ailleurs dans l'application. Les longueurs 30 / 31 / 14
// sont premières entre elles, donc deux indices différents (jusqu'à 930) ne
// donnent jamais le même nom complet.
const FIRST_NAMES = [
  "Aminata", "Kofi", "Ngozi", "Yannick", "Sandrine", "Moussa", "Adjoa", "Emeka", "Brice", "Nadia",
  "Cheikh", "Rosine", "Olivier", "Esther", "Idriss", "Chantal", "Yaw", "Blessing", "Serge", "Mariama",
  "Landry", "Akosua", "Boubacar", "Larissa", "Tunde", "Prisca", "Alassane", "Josiane", "Kwabena", "Odile",
];
const LAST_NAMES = [
  "Nkomo", "Ouédraogo", "Mensah", "Eyenga", "Adeyemi", "Traoré", "Ndongo", "Boateng", "Camara", "Fotso",
  "Okoro", "Sow", "Tchamba", "Appiah", "Bamba", "Onana", "Eze", "Koné", "Mballa", "Danso",
  "Sarr", "Olawale", "Ekani", "Diop", "Quartey", "Nzouankeu", "Akintola", "Coulibaly", "Biloa", "Yeboah",
  "Ngassa",
];
const CITIES = [
  "Douala, Cameroun", "Yaoundé, Cameroun", "Bafoussam, Cameroun", "Garoua, Cameroun", "Accra, Ghana",
  "Kumasi, Ghana", "Lagos, Nigéria", "Abuja, Nigéria", "Dakar, Sénégal", "Thiès, Sénégal",
  "Abidjan, Côte d'Ivoire", "Bamako, Mali", "Libreville, Gabon", "Cotonou, Bénin",
];

export function demoPersonAt(index) {
  return {
    name: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 7 + 5) % LAST_NAMES.length]}`,
    city: CITIES[(index * 3 + 1) % CITIES.length],
  };
}
