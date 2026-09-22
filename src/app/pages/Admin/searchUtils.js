// ----------------------------------------------------------------------
// Normalise un texte pour une comparaison de recherche tolérante : accents
// retirés (NFD + suppression des diacritiques), casse ignorée, espaces/
// tirets/soulignés multiples réduits à un seul espace. Sert à toutes les
// recherches "au fil de la frappe" de l'admin (Gestion des membres,
// Gestion du réseau, Formation, Gouvernance…) pour qu'un clavier réglé en
// anglais (sans accès facile aux accents) retrouve quand même "Sénégal" en
// tapant "senegal", "Aïcha" en tapant "aicha", etc. — comparer les DEUX
// côtés (le texte cherché ET la requête tapée) avec la même fonction
// suffit : les accents de part et d'autre s'annulent.
//
// Même logique que normalizeRegionKey (Reseau/countryMaps.js) et l'ex-
// normalizeCountryKey (context/NetworkDataContext.jsx), qui comparaient
// déjà noms de région et de pays de cette façon — cette fonction-ci est
// le point commun désormais utilisé par toute recherche de texte libre,
// pour ne plus avoir à réimplémenter la même normalisation à chaque
// nouvel endroit qui cherche quelque chose.
export function normalizeSearchText(value) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .trim();
}

// Vrai si "haystack" contient "needle" une fois les deux normalisés — le
// raccourci le plus courant (équivalent à
// normalizeSearchText(haystack).includes(normalizeSearchText(needle))),
// pour éviter de répéter l'appel double à chaque site d'appel.
export function searchTextIncludes(haystack, needle) {
  return normalizeSearchText(haystack).includes(normalizeSearchText(needle));
}
