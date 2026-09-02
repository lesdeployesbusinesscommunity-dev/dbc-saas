// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { formatMoney, formatRange } from "./data";

// ----------------------------------------------------------------------

// Tableau comparatif des 8 niveaux (construit en grille plutôt qu'avec
// un <table> classique, pour un contrôle fiable du style entre
// navigateurs). La ligne du niveau sélectionné dans le simulateur juste
// au-dessus ressort simplement — pas de glow, une bordure de couleur à
// gauche + texte en gras, comme l'onglet actif du header.
export function ComparisonTable({ levels, selectedKey }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border-2 border-[#52A2DF]/[0.1] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span aria-hidden="true">▦</span>
          {t("simulateur.tableTitle")}
        </h2>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[680px]">
            {/* En-têtes */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr] gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div>{t("simulateur.tableHeaders.level")}</div>
              <div>{t("simulateur.tableHeaders.cotisation")}</div>
              <div>{t("simulateur.tableHeaders.commission")}</div>
              <div>{t("simulateur.tableHeaders.cagnotte")}</div>
              <div>{t("simulateur.tableHeaders.potentiel")}</div>
            </div>

            {/* Lignes */}
            <div className="flex flex-col gap-3">
              {levels.map((level) => {
                const isSelected = level.key === selectedKey;

                return (
                  <div
                    key={level.key}
                    className={clsx(
                      "grid grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr] items-center gap-2 rounded-lg border-l-4 px-3 py-3 text-sm transition-colors duration-300",
                      isSelected
                        ? clsx(
                            level.borderClass,
                            level.bgTintClass,
                            "font-semibold",
                          )
                        : "border-transparent bg-white shadow-sm",
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
                        level.borderClass,
                        level.textClass,
                        level.bgTintClass,
                      )}
                    >
                      <span aria-hidden="true">{level.emoji}</span>
                      {t(`simulateur.levels.${level.key}.name`)}
                    </span>
                    <span className="text-gray-700">
                      {formatMoney(level.cotisation, locale)}
                    </span>
                    <span className="font-semibold text-[#E11D48]">
                      {formatMoney(level.commission, locale)}
                    </span>
                    <span className="font-semibold text-[#DB2777]">
                      {formatMoney(level.cagnotte, locale)}
                    </span>
                    <span className="font-semibold text-[#4C1D95]">
                      {formatRange(level.potentielMin, level.potentielMax, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {t("simulateur.footnote")}
        </p>
      </div>
    </div>
  );
}
