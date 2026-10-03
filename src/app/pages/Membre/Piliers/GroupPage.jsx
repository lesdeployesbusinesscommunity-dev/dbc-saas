// Import Dependencies
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AcademicCapIcon, ArrowLeftIcon, ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { pillarGroups } from "app/pages/Admin/Piliers/mockData";
import { getPillarText, usePillars } from "app/pages/Admin/Piliers/pillarsStore";
import { currentMember } from "../currentMember";
import { LongrichPacksTable } from "./LongrichPacksTable";
import { groupStyles, statusStyles } from "./pillarStyles";

// ----------------------------------------------------------------------

// Page d'UN pilier (/membre/piliers/detail/:group), ouverte par son lien
// "Détail <pilier> →" sur la page Piliers : le catalogue complet du pilier
// — une fiche par programme, avec sa description et, pour FORMER, son
// repère de niveau (Niv.1→4, Niv.3+...). Les programmes de FINANCER et
// d'INVESTIR ont en plus leur propre page d'explication (la fiche y
// mène, voir PillarPage.jsx). FINANCER montre aussi le tableau des packs
// Longrich ; FORMER renvoie vers la page Formation, où se suivent les
// formations.
export default function GroupPage() {
  const { t } = useTranslation();
  const { group: groupKey } = useParams();
  const group = pillarGroups.find((entry) => entry.key === groupKey);
  const pillars = usePillars();

  if (!group) {
    return (
      <Page title={`${t("membre.nav.piliers")} – ${currentMember.name}`}>
        <div className="p-6 lg:p-8">
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
            <h1 className="text-base font-bold text-gray-900">{t("membre.piliers.notFound.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("membre.piliers.notFound.text")}</p>
            <Link
              to="/membre/piliers"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              {t("membre.piliers.back")}
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  const style = groupStyles[group.key];
  const GroupIcon = group.Icon;
  const items = pillars.filter((pillar) => pillar.group === group.key && pillar.visible);
  const title = t(`membre.piliers.groups.${group.key}.title`);
  const others = pillarGroups.filter((entry) => entry.key !== group.key);

  return (
    <Page title={`${title} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <Link
          to="/membre/piliers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {t("membre.piliers.back")}
        </Link>

        <header className="mt-4 flex flex-wrap items-start gap-4">
          <span className={clsx("flex size-16 shrink-0 items-center justify-center rounded-3xl", style.iconBoxClass)}>
            <GroupIcon aria-hidden="true" className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={clsx("text-xs font-bold uppercase tracking-[0.15em]", style.textClass)}>
              {group.number} · {title}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              <span className="uppercase">{title}</span> — {t(`membre.piliers.groups.${group.key}.subtitle`)}
            </h1>
            <p className="mt-1 text-sm italic text-gray-500">{t(`membre.piliers.groups.${group.key}.quote`)}</p>
          </div>
        </header>

        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            {t("membre.piliers.emptyGroup")}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((pillar) => {
              const text = getPillarText(pillar, t);
              const Icon = pillar.Icon;
              const body = (
                <>
                  <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl", style.iconBoxClass)}>
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-gray-900">{text.name}</span>
                      {text.tag && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                          {text.tag}
                        </span>
                      )}
                      {pillar.status !== "active" && (
                        <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-bold", statusStyles[pillar.status])}>
                          {t(`piliers.status.${pillar.status}`)}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">{text.summary}</span>
                  </span>
                  {pillar.page && (
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                    />
                  )}
                </>
              );
              const cardClass =
                "group flex items-start gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm";

              return pillar.page ? (
                <Link
                  key={pillar.id}
                  to={`/membre/piliers/${pillar.id}`}
                  className={clsx(cardClass, "transition-colors hover:border-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52A2DF]")}
                >
                  {body}
                </Link>
              ) : (
                <div key={pillar.id} className={cardClass}>
                  {body}
                </div>
              );
            })}
          </div>
        )}

        {group.key === "financer" && <LongrichPacksTable />}

        {group.key === "former" && (
          <Link
            to="/membre/formation"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#EE7115] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <AcademicCapIcon aria-hidden="true" className="size-5" />
            {t("membre.piliers.formationCta")}
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        )}

        <section className="mt-10" aria-labelledby="pillar-others">
          <h2 id="pillar-others" className="text-sm font-bold uppercase tracking-wide text-gray-400">
            {t("membre.piliers.otherGroups")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((entry) => {
              const OtherIcon = entry.Icon;
              return (
                <Link
                  key={entry.key}
                  to={`/membre/piliers/detail/${entry.key}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <OtherIcon aria-hidden="true" className={clsx("size-4", groupStyles[entry.key].textClass)} />
                  {entry.number} · {t(`membre.piliers.groups.${entry.key}.title`)}
                  <ChevronRightIcon aria-hidden="true" className="size-4 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </Page>
  );
}
