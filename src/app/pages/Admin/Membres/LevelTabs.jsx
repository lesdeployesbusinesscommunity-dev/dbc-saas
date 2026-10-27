// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { levels, formatMoney } from "app/pages/Simulateur/data";
import { levelNumbers } from "./mockData";

// ----------------------------------------------------------------------

// Rangée d'onglets pilule : "Tous les niveaux" en premier (pour tout voir
// d'un coup), puis un onglet par niveau avec, en dessous du numéro, le
// montant de la cagnotte de ce niveau (level.cagnotte, la même donnée que
// sur la page Simulateur). Celui actif ressort en orange plein, les
// autres restent neutres sur fond gris clair — look aligné sur la
// maquette de référence donnée par l'utilisateur. La création d'un membre
// se fait désormais par un seul bouton, "Créer un membre", en haut de la
// page (voir Membres/index.jsx) : il reprend le niveau ouvert ici.
export function LevelTabs({ activeLevel, onSelect }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-stretch gap-2 rounded-full bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={clsx(
            "flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
            activeLevel === "all"
              ? "bg-[#EE7115] text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
          )}
        >
          {t("admin.membres.allLevels")}
        </button>

        {levels.map((level) => {
          const isActive = level.key === activeLevel;
          return (
            <button
              key={level.key}
              type="button"
              onClick={() => onSelect(level.key)}
              className={clsx(
                "flex flex-col items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                isActive
                  ? "bg-[#EE7115] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              <span>{t("admin.membres.level", { n: levelNumbers[level.key] })}</span>
              <span
                className={clsx(
                  "text-[10px] font-semibold",
                  isActive ? "text-white/80" : "text-gray-400",
                )}
              >
                {formatMoney(level.cagnotte, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
