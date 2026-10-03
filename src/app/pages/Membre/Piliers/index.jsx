// Import Dependencies
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, PlayIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { pillarGroups } from "app/pages/Admin/Piliers/mockData";
import { getPillarText, usePillars } from "app/pages/Admin/Piliers/pillarsStore";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { groupStyles } from "./pillarStyles";

// ----------------------------------------------------------------------

// Page "Piliers" (/membre/piliers), après Formation : les 4 piliers de la
// DBC — 01 FINANCER, 02 FORMER, 03 RÉSEAUTER, 04 INVESTIR — chacun avec sa
// phrase d'accroche, la liste de ses six programmes, et un lien "Détail
// <pilier> →" qui ouvre la page de ce pilier avec son catalogue complet
// (voir GroupPage.jsx). La liste, les statuts et les textes viennent de la
// même source que la page admin (voir Admin/Piliers/pillarsStore.js) : un
// programme masqué par l'admin disparaît d'ici.
export default function MembrePiliers() {
  const { t } = useTranslation();
  const pillars = usePillars().filter((pillar) => pillar.visible);

  return (
    <Page title={`${t("membre.nav.piliers")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="membre.nav.piliers" />

        <p className="mt-4 max-w-3xl text-sm text-gray-600">{t("membre.piliers.intro")}</p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pillarGroups.map((group) => {
            const style = groupStyles[group.key];
            const GroupIcon = group.Icon;
            const items = pillars.filter((pillar) => pillar.group === group.key);
            const title = t(`membre.piliers.groups.${group.key}.title`);

            return (
              <article
                key={group.key}
                className="relative flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <div aria-hidden="true" className={clsx("absolute inset-x-0 top-0 h-1", style.barClass)} />

                <div className="flex items-start gap-4">
                  <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl", style.iconBoxClass)}>
                    <GroupIcon aria-hidden="true" className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className={clsx("text-sm font-bold uppercase tracking-[0.15em]", style.textClass)}>
                      {group.number} · {title}
                    </h2>
                    <p className="mt-1 text-sm italic text-gray-600">{t(`membre.piliers.groups.${group.key}.quote`)}</p>
                  </div>
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {items.map((pillar) => {
                    const text = getPillarText(pillar, t);
                    return (
                      <li key={pillar.id} className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                        <PlayIcon aria-hidden="true" className={clsx("size-3 shrink-0", style.bulletClass)} />
                        <span className="min-w-0">
                          {text.name}
                          {pillar.status !== "active" && (
                            <span className="ml-1.5 font-normal italic text-gray-400">
                              ({t(`piliers.status.${pillar.status}`).toLowerCase()})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  to={`/membre/piliers/detail/${group.key}`}
                  className={clsx(
                    "mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]",
                    style.ctaClass,
                  )}
                >
                  {t("membre.piliers.detailLink", { group: title })}
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </Page>
  );
}
