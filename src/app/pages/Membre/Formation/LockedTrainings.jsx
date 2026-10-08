// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleStackIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { LevelDetailModal } from "../Coins/LevelDetailModal";
import { getDomain } from "./domains";
import { getLockedCatalog } from "./mockData";
import { courseMatches } from "./searchFilter";

// ----------------------------------------------------------------------

// "Débloque d'autres formations" : les formations des niveaux auxquels le
// membre ne cotise pas encore, en aperçu verrouillé. Pas de bouton
// "Commencer" (elles ne sont pas accessibles — la page de cours le refuse
// aussi, voir CoursePage.jsx) : le bouton ouvre à la place le détail du
// niveau requis, avec "Solliciter ce niveau" (même fenêtre que depuis le
// classement des Coins : Coins/LevelDetailModal.jsx). Indépendant du
// niveau consulté et des filtres du catalogue — mais PAS de la recherche de
// l'en-tête ("query", voir index.jsx), qui filtre aussi ces formations : sans
// résultat ici, toute la section disparaît plutôt que de montrer un titre
// au-dessus de rien.
export function LockedTrainings({ query = "" }) {
  const { t } = useTranslation();
  const [selectedLevelKey, setSelectedLevelKey] = useState(null);
  const groups = getLockedCatalog(currentMember.levelKeys)
    .map((group) => ({
      ...group,
      courses: group.courses.filter((course) => courseMatches(course, query, t)),
    }))
    .filter((group) => group.courses.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <LockClosedIcon aria-hidden="true" className="size-5 text-gray-400" />
        {t("membre.formation.lockedSection.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("membre.formation.lockedSection.subtitle")}</p>

      {groups.map((group) => {
        const level = levels.find((l) => l.key === group.levelKey);
        const LevelIcon = level?.Icon;
        return (
          <div key={group.levelKey} className="mt-6">
            <button
              type="button"
              onClick={() => setSelectedLevelKey(group.levelKey)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-shadow hover:shadow-sm",
                level?.borderClass,
                level?.textClass,
                level?.bgTintClass,
              )}
            >
              {LevelIcon && <LevelIcon aria-hidden="true" className="size-3.5" />}
              {t(`simulateur.levels.${group.levelKey}.name`)}
            </button>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.courses.map((course) => {
                const domain = getDomain(course.domainKey);
                const DomainIcon = domain.Icon;
                return (
                  <article
                    key={course.id}
                    className="flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"
                  >
                    <div className="relative">
                      <img
                        src={course.poster}
                        alt=""
                        aria-hidden="true"
                        className="h-28 w-full bg-gray-100 object-cover opacity-50 grayscale"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/90 shadow">
                          <LockClosedIcon className="size-6 text-gray-500" />
                        </span>
                      </span>
                      <span
                        className={clsx(
                          "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm",
                          domain.chipClass,
                        )}
                      >
                        <DomainIcon aria-hidden="true" className="size-3.5" />
                        {t(`membre.formation.domains.${course.domainKey}`)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-bold text-gray-700">{course.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("membre.formation.card.trainer", { name: course.trainer })} · {course.duration}
                      </p>
                      <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                        <CircleStackIcon aria-hidden="true" className="size-3.5" />
                        {t("membre.formation.card.coinsToEarn", { coins: course.coinsReward })}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-gray-500">
                        {t("membre.formation.lockedSection.requires", {
                          level: t(`simulateur.levels.${course.levelKey}.name`),
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedLevelKey(course.levelKey)}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <LockClosedIcon aria-hidden="true" className="size-4" />
                        {t("membre.formation.lockedSection.discover")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      <LevelDetailModal
        levelKey={selectedLevelKey}
        open={!!selectedLevelKey}
        onClose={() => setSelectedLevelKey(null)}
      />
    </section>
  );
}
