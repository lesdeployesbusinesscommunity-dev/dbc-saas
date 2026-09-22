// Import Dependencies
import { useId } from "react";

// ----------------------------------------------------------------------

// Bande décorative géométrique — une rangée de triangles inspirée des
// motifs textiles traditionnels (kente, bogolan...), utilisée comme
// signature visuelle discrète de l'espace admin : haut de la sidebar,
// sous un titre de page, pied de carte... Toujours en fine bande, jamais
// en fond plein, pour que le design reste "haut standing" et lisible
// plutôt que surchargé.
//
// Les couleurs par défaut reprennent la palette DBC déclarée dans
// tailwind.config.js (orange/bleu de marque + les 4 teintes terre
// ajoutées : clay, gold, forest, indigo).
export const DBC_PATTERN_COLORS = ["#EE7115", "#D8A22C", "#1B4332", "#52A2DF", "#B2461D", "#2E1F5E"];

// `useId()` garantit un id de motif unique même si plusieurs bandes sont
// affichées sur la même page (sidebar + en-tête, par exemple) — sans ça,
// deux <pattern> SVG portant le même id entreraient en conflit.
export function PatternStrip({ className = "h-2 w-full", colors = DBC_PATTERN_COLORS }) {
  const patternId = `dbc-pattern-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const tileWidth = 22;
  const tileHeight = 16;
  const fullTileWidth = tileWidth * colors.length;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox={`0 0 ${fullTileWidth} ${tileHeight}`}
      className={className}
    >
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width={fullTileWidth} height={tileHeight}>
          {colors.map((color, index) => (
            <polygon
              key={color + index}
              points={`${index * tileWidth},${tileHeight} ${(index + 0.5) * tileWidth},0 ${(index + 1) * tileWidth},${tileHeight}`}
              fill={color}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
