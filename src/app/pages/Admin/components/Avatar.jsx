// Import Dependencies
import clsx from "clsx";

// ----------------------------------------------------------------------

// Dégradé de couleurs de secours pour les avatars sans photo : la couleur
// est choisie de façon stable à partir du nom (même nom -> même couleur),
// pour que la liste ne soit pas monochrome tout en restant prévisible.
const FALLBACK_COLORS = [
  "bg-[#52A2DF]",
  "bg-[#EE7115]",
  "bg-[#7C3AED]",
  "bg-[#16A34A]",
  "bg-[#E11D48]",
  "bg-[#0D9488]",
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFallbackColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % FALLBACK_COLORS.length;
  }
  return FALLBACK_COLORS[hash];
}

// Avatar réutilisable : affiche la photo si "src" est fourni, sinon un
// rond de couleur avec les initiales du nom (règle donnée pour le profil
// admin, appliquée aussi aux membres tant qu'aucune vraie photo n'est
// disponible côté backend).
export function Avatar({ name, src, size = "size-10", className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(size, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden={!!name}
      className={clsx(
        size,
        getFallbackColor(name),
        "flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
