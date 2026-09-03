// ----------------------------------------------------------------------
// Les 8 niveaux DBC. Chaque niveau porte ses classes Tailwind écrites en
// toutes lettres (jamais construites via un gabarit `bg-[${color}]`) :
// Tailwind ne détecte que les chaînes littérales présentes dans le
// fichier, sinon la classe ne sera jamais générée (même règle que sur
// les autres pages du site). Le "name" et les "advantages" viennent des
// fichiers de traduction (clé simulateur.levels.<key>) pour supporter le
// FR/EN — ce fichier ne garde que les données chiffrées et les couleurs.
export const levels = [
  {
    key: "starter",
    emoji: "🌱",
    cotisation: 5000,
    commission: 1000,
    cagnotte: 55000,
    potentielMin: 36000,
    potentielMax: 200000,
    textClass: "text-[#52A2DF]",
    borderClass: "border-[#52A2DF]",
    bgTintClass: "bg-[#52A2DF]/[0.1]",
  },
  {
    key: "batisseur",
    emoji: "🏗️",
    cotisation: 10000,
    commission: 2000,
    cagnotte: 110000,
    potentielMin: 72000,
    potentielMax: 400000,
    textClass: "text-[#EE7115]",
    borderClass: "border-[#EE7115]",
    bgTintClass: "bg-[#EE7115]/[0.1]",
  },
  {
    key: "batisseurPro",
    emoji: "⚒️",
    cotisation: 30000,
    commission: 5000,
    cagnotte: 330000,
    potentielMin: 180000,
    potentielMax: 1000000,
    textClass: "text-[#7C3AED]",
    borderClass: "border-[#7C3AED]",
    bgTintClass: "bg-[#7C3AED]/[0.1]",
  },
  {
    key: "performer",
    emoji: "🎯",
    cotisation: 100000,
    commission: 10000,
    cagnotte: 1100000,
    potentielMin: 360000,
    potentielMax: 4000000,
    textClass: "text-[#CA8A04]",
    borderClass: "border-[#CA8A04]",
    bgTintClass: "bg-[#CA8A04]/[0.1]",
  },
  {
    key: "performerPro",
    emoji: "🔭",
    cotisation: 165000,
    commission: 15000,
    cagnotte: 1815000,
    potentielMin: 540000,
    potentielMax: 8000000,
    textClass: "text-[#16A34A]",
    borderClass: "border-[#16A34A]",
    bgTintClass: "bg-[#16A34A]/[0.1]",
  },
  {
    key: "stratege",
    emoji: "♟️",
    cotisation: 350000,
    commission: 20000,
    cagnotte: 3850000,
    potentielMin: 720000,
    potentielMax: 20000000,
    textClass: "text-[#E11D48]",
    borderClass: "border-[#E11D48]",
    bgTintClass: "bg-[#E11D48]/[0.1]",
  },
  {
    key: "elite",
    emoji: "⚜️",
    cotisation: 900000,
    commission: 100000,
    cagnotte: 9900000,
    potentielMin: 3600000,
    potentielMax: 100000000,
    textClass: "text-[#4F46E5]",
    borderClass: "border-[#4F46E5]",
    bgTintClass: "bg-[#4F46E5]/[0.1]",
  },
  {
    key: "legende",
    emoji: "👑",
    cotisation: 2000000,
    commission: 200000,
    cagnotte: 22000000,
    potentielMin: 7200000,
    potentielMax: Infinity,
    textClass: "text-[#B45309]",
    borderClass: "border-[#B45309]",
    bgTintClass: "bg-[#B45309]/[0.1]",
  },
];

// Formate un montant, séparateur de milliers selon la langue active
// (espace en français, virgule en anglais — ex: "1 815 000 F" vs
// "1,815,000 F"). "Infinity" (borne haute du niveau Légende) donne "∞ F".
export function formatMoney(value, locale = "fr-FR") {
  if (value === Infinity) return "∞ F";
  return `${Math.round(value).toLocaleString(locale)} F`;
}

// Formate une fourchette potentiel/an (ex: "36 000–200 000 F").
export function formatRange(min, max, locale = "fr-FR") {
  const formattedMin = Math.round(min).toLocaleString(locale);
  const formattedMax = max === Infinity ? "∞" : Math.round(max).toLocaleString(locale);
  return `${formattedMin}–${formattedMax} F`;
}
