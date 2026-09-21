// ----------------------------------------------------------------------
// Icône "pin" de localisation classique (même silhouette que MapPinIcon de
// Heroicons), dessinée à la main en SVG brut plutôt qu'importée en tant que
// composant React : ce fichier construit sa propre balise <svg>/<path> pour
// la carte, un <MapPinIcon> ne peut pas s'imbriquer directement dedans.
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z";

// Carte régionale générique (Cameroun, Nigéria, Ghana, Sénégal, Mali, …) :
// régions dessinées en gris clair, avec un pin de localisation orange sur
// chaque région où la DBC a déjà une branche pourvue (calculé à partir du
// vrai arbre du réseau, voir "presenceRegions" — passé par countryMaps.js /
// Reseau/index.jsx, jamais une liste figée ici). Survoler une région
// affiche son nom (title natif du navigateur).
//
// Historique : ce composant s'appelait à l'origine "CameroonMap" et ne
// gérait que le Cameroun (régions/viewBox importées en dur). Il a été
// généralisé pour servir à tous les pays (régions/viewBox reçus en props)
// quand la carte de présence s'est étendue au-delà du Cameroun — voir
// countryMaps.js, qui construit un <RegionMap> par pays à partir de son
// fichier de régions (cameroonRegions.js, nigeriaRegions.js, …). Le nom du
// fichier n'a pas été renommé : cet environnement ne permet pas de
// supprimer/renommer un fichier déjà déployé sur le poste de l'admin, donc
// mieux vaut garder ce chemin que laisser un fichier CameroonMap.jsx orphelin
// à côté d'un nouveau RegionMap.jsx.
export function RegionMap({ regions, viewBox, presenceRegions = [], className = "", ariaLabel }) {
  const withPresence = regions.filter((region) => presenceRegions.includes(region.name));

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={ariaLabel}>
      {regions.map((region) => {
        const hasPresence = presenceRegions.includes(region.name);
        return (
          <path
            key={region.name}
            d={region.path}
            fill={hasPresence ? "#52A2DF" : "#E5E7EB"}
            fillOpacity={hasPresence ? 0.22 : 1}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <title>{region.name}</title>
          </path>
        );
      })}

      {withPresence.map((region) => {
        const [cx, cy] = region.centroid;
        const scale = 0.85;
        return (
          <g
            key={`pin-${region.name}`}
            transform={`translate(${cx} ${cy}) scale(${scale}) translate(-12 -23)`}
          >
            <path d={PIN_PATH} fill="#EE7115" stroke="#ffffff" strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
}
