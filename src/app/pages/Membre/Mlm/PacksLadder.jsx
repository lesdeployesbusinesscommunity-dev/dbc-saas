// Import Dependencies
import { useTranslation } from "react-i18next";
import { CubeIcon, UserPlusIcon, BoltIcon, StarIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { formatMoney, levels } from "app/pages/Simulateur/data";
import { getLongrichPacks, getMyPack } from "./mockData";

// ----------------------------------------------------------------------

// "Les 6 packs Longrich" : un escalier de marches plutôt qu'un tableau
// classique (demandé explicitement, pour ne pas répéter le style déjà
// utilisé par le comparatif des niveaux DBC — voir Simulateur/
// ComparisonTable.jsx) — chaque pack occupe une marche dont la hauteur
// grandit avec le rang, du plus accessible (à gauche) au plus prestigieux
// (à droite). Les hauteurs ne sont PAS proportionnelles au prix réel
// (l'écart va de 24 000 F à 1 800 000 F — une vraie proportion rendrait
// les premières marches minuscules et illisibles) : elles marquent
// uniquement le classement, le prix et les PV restent toujours en texte
// clair sur chaque marche, jamais seulement suggérés par la hauteur.
//
// Couleur + icône par marche réutilisent celles déjà associées à ce
// niveau DBC partout ailleurs dans l'app (voir Simulateur/data.js :
// "levels", déjà utilisé tel quel par ComparisonTable.jsx) plutôt qu'une
// nouvelle palette : garder la même convention de couleur par niveau que
// le reste du site plutôt qu'un simple dégradé clair→foncé.
const STEP_HEIGHT_CLASSES = ["h-36", "h-40", "h-44", "h-48", "h-52", "h-56"];

export function PacksLadder({ highlightCurrent = true }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const packs = getLongrichPacks();
  const myPack = getMyPack();

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <CubeIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.mlm.packs.title")}
      </h2>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-max px-1 pb-1">
          <div className="flex items-end gap-3">
            {packs.map((pack, index) => {
              const level = levels.find((l) => l.key === pack.levelKey);
              // "highlightCurrent" à false quand cet escalier sert de porte
              // d'entrée sur la page d'un membre pas encore éligible (voir
              // MlmIneligible.jsx) : il n'a justement AUCUN pack actuel, donc
              // lui montrer "Mon pack actuel" sur un pack (Elite, voir
              // mockData.js : "getMyPack") contredirait le message du dessus.
              const isMine = highlightCurrent && pack.levelKey === myPack.eligibleLevelKey;
              const Icon = level?.Icon ?? CubeIcon;

              return (
                <div
                  key={pack.levelKey}
                  className={clsx(
                    "flex w-36 shrink-0 flex-col justify-between rounded-t-2xl border p-4 shadow-sm transition-shadow",
                    STEP_HEIGHT_CLASSES[index],
                    level?.borderClass ?? "border-gray-200",
                    level?.bgTintClass ?? "bg-gray-50",
                    isMine && "border-2 shadow-md",
                  )}
                >
                  <div>
                    {isMine && (
                      <span
                        className={clsx(
                          "mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
                          level?.textClass,
                        )}
                      >
                        <StarIcon aria-hidden="true" className="size-3" />
                        {t("membre.mlm.packs.currentBadge")}
                      </span>
                    )}
                    <p className={clsx("flex items-center gap-1.5 text-sm font-bold", level?.textClass ?? "text-gray-900")}>
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      {t(`membre.mlm.packs.name.${pack.levelKey}`)}
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(pack.price, locale)}</p>
                    <p className="text-xs text-gray-500">{pack.pv} PV</p>
                    <span
                      className={clsx(
                        "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        pack.gainType === "referral"
                          ? "bg-gray-100 text-gray-500"
                          : clsx(level?.bgTintClass, level?.textClass),
                      )}
                    >
                      {pack.gainType === "referral" ? (
                        <UserPlusIcon aria-hidden="true" className="size-3" />
                      ) : (
                        <BoltIcon aria-hidden="true" className="size-3" />
                      )}
                      {t(`membre.mlm.packs.gainType.${pack.gainType}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Socle commun : fait lire l'ensemble comme un escalier posé sur
              une base, pas comme des cartes flottantes isolées. */}
          <div className="h-1.5 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
