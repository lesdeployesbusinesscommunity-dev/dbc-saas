// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

// Pastille du niveau (icône + nom), avec les couleurs du niveau — les mêmes
// que sur la page Simulateur et "Gestion financière".
export function LevelBadge({ levelKey, className }) {
  const { t } = useTranslation();
  const level = levels.find((l) => l.key === levelKey);
  if (!level) return null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        level.borderClass,
        level.textClass,
        level.bgTintClass,
        className,
      )}
    >
      <level.Icon aria-hidden="true" className="size-3.5" />
      {t(`simulateur.levels.${levelKey}.name`)}
    </span>
  );
}
