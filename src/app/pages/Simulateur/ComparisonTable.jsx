// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { formatMoney, formatRange } from "./data";
import { ConfirmRequestPopover } from "app/pages/Membre/components/ConfirmRequestPopover";

// ----------------------------------------------------------------------

// Tableau comparatif des 8 niveaux (construit en grille plutôt qu'avec
// un <table> classique, pour un contrôle fiable du style entre
// navigateurs). La ligne du niveau sélectionné dans le simulateur juste
// au-dessus ressort simplement — pas de glow, une bordure de couleur à
// gauche + texte en gras, comme l'onglet actif du header.
//
// "onSelect" est optionnel : sans lui (page Simulateur, côté visiteur),
// le tableau reste purement informatif comme avant. Quand il est fourni
// (page Finance, côté admin), chaque ligne devient un bouton cliquable
// qui permet de changer le niveau sélectionné directement depuis le
// tableau.
//
// "myLevelKeys" est optionnel aussi : fourni uniquement par le Dashboard
// membre (voir Dashboard/index.jsx), il ajoute une 6e colonne "Solliciter"
// — un bouton par niveau que le membre n'a pas encore (voir
// currentMember.js : "levelKeys"), pour demander à démarrer sa tontine à
// ce niveau ; les niveaux déjà actifs affichent juste un badge "Déjà
// membre" à la place. Ne JAMAIS combiner avec "onSelect" : la ligne
// deviendrait un <button> contenant un autre bouton (le popover), invalide
// en HTML — aucun des deux appels actuels ne fait les deux à la fois.
export function ComparisonTable({ levels, selectedKey, onSelect, myLevelKeys }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const showRequestColumn = Array.isArray(myLevelKeys);
  const gridColsClass = showRequestColumn
    ? "grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1fr_1fr]"
    : "grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr]";

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
            <div
              className={clsx(
                "grid gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500",
                gridColsClass,
              )}
            >
              <div>{t("simulateur.tableHeaders.level")}</div>
              <div>{t("simulateur.tableHeaders.cotisation")}</div>
              <div>{t("simulateur.tableHeaders.commission")}</div>
              <div>{t("simulateur.tableHeaders.cagnotte")}</div>
              <div>{t("simulateur.tableHeaders.potentiel")}</div>
              {showRequestColumn && <div>{t("membre.dashboard.comparison.requestColumn")}</div>}
            </div>

            {/* Lignes */}
            <div className="flex flex-col gap-3">
              {levels.map((level) => {
                const isSelected = level.key === selectedKey;
                const RowTag = onSelect ? "button" : "div";
                const alreadyMember = showRequestColumn && myLevelKeys.includes(level.key);

                return (
                  <RowTag
                    key={level.key}
                    type={onSelect ? "button" : undefined}
                    onClick={onSelect ? () => onSelect(level) : undefined}
                    className={clsx(
                      "grid items-center gap-2 rounded-lg border-l-4 px-3 py-3 text-left text-sm transition-colors duration-300",
                      gridColsClass,
                      isSelected
                        ? clsx(
                            level.borderClass,
                            level.bgTintClass,
                            "font-semibold",
                          )
                        : "border-transparent bg-white shadow-sm",
                      onSelect && "w-full cursor-pointer hover:ring-2 hover:ring-black/5",
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
                      <level.Icon aria-hidden="true" className="size-3.5" />
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
                    {showRequestColumn && (
                      <span onClick={(event) => event.stopPropagation()}>
                        {alreadyMember ? (
                          <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                            {t("membre.dashboard.comparison.alreadyMember")}
                          </span>
                        ) : (
                          <ConfirmRequestPopover
                            triggerClassName="rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            question={t("membre.dashboard.comparison.requestQuestion", {
                              level: t(`simulateur.levels.${level.key}.name`),
                            })}
                            request={{ type: "level", levelKey: level.key }}
                          >
                            {t("membre.dashboard.comparison.requestButton")}
                          </ConfirmRequestPopover>
                        )}
                      </span>
                    )}
                  </RowTag>
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
