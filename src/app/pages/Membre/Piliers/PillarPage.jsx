// Import Dependencies
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, ChevronRightIcon, UsersIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { pillarGroups } from "app/pages/Admin/Piliers/mockData";
import { getPillarText, usePillars } from "app/pages/Admin/Piliers/pillarsStore";
import { currentMember } from "../currentMember";
import { LongrichPacksTable } from "./LongrichPacksTable";
import { groupStyles, statusStyles } from "./pillarStyles";

// ----------------------------------------------------------------------

// Page d'UN pilier (/membre/piliers/:pillarId), ouverte par son bouton sur
// la page Piliers (voir index.jsx) : ce que c'est, comment ça se présente,
// à qui ça s'adresse, les chiffres clés quand il y en a, et un bouton vers
// la page de l'espace membre qui existe déjà pour ce pilier (la Tontine
// Royale, c'est "Ma Tontine" ; le Business MLM Longrich, "Mon MLM"). Le
// pilier "Business MLM Longrich" affiche en plus le tableau des packs
// (voir LongrichPacksTable.jsx). Les textes viennent de i18n, sauf si
// l'admin les a modifiés (voir Admin/Piliers/pillarsStore.js).
export default function PillarPage() {
  const { t } = useTranslation();
  const { pillarId } = useParams();
  const pillars = usePillars();
  const pillar = pillars.find((entry) => entry.id === pillarId && entry.visible && entry.page);

  if (!pillar) {
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

  const text = getPillarText(pillar, t);
  const style = groupStyles[pillar.group];
  const group = pillarGroups.find((entry) => entry.key === pillar.group);
  const GroupIcon = group.Icon;
  const groupTitle = t(`membre.piliers.groups.${pillar.group}.title`);
  const Icon = pillar.Icon;
  const siblings = pillars.filter(
    (entry) => entry.group === pillar.group && entry.visible && entry.page && entry.id !== pillar.id,
  );

  return (
    <Page title={`${text.name} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <Link
          to={`/membre/piliers/detail/${pillar.group}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {t("membre.piliers.backToGroup", { group: groupTitle })}
        </Link>

        <header className="mt-4 flex flex-wrap items-start gap-4">
          <span className={clsx("flex size-16 shrink-0 items-center justify-center rounded-3xl", style.iconBoxClass)}>
            <Icon aria-hidden="true" className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", style.badgeClass)}>
                <GroupIcon aria-hidden="true" className="size-3.5" />
                {group.number} · {groupTitle}
              </span>
              {pillar.status !== "active" && (
                <span className={clsx("rounded-full px-2.5 py-1 text-[11px] font-bold", statusStyles[pillar.status])}>
                  {t(`piliers.status.${pillar.status}`)}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{text.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">{text.summary}</p>
          </div>
        </header>

        {text.facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {text.facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <dd className="text-lg font-bold text-gray-900">{fact.value}</dd>
                <dt className="mt-0.5 text-xs text-gray-500">{fact.label}</dt>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900">{t("membre.piliers.detail.principle")}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{text.overview}</p>
            </section>

            {text.points.length > 0 && (
              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900">{t("membre.piliers.detail.points")}</h2>
                <ul className="mt-3 space-y-2.5">
                  {text.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-green-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {text.audience && (
              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <UsersIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
                  {t("membre.piliers.detail.audience")}
                </h2>
                <p className="mt-2 text-sm text-gray-600">{text.audience}</p>
              </section>
            )}

            {pillar.link && (
              <Link
                to={pillar.link}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#EE7115] px-5 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t(`membre.piliers.open.${pillar.id}`)}
                <ArrowRightIcon aria-hidden="true" className="size-5 shrink-0" />
              </Link>
            )}
          </aside>
        </div>

        {pillar.id === "mlm-longrich" && <LongrichPacksTable />}

        {siblings.length > 0 && (
          <section className="mt-8" aria-labelledby="pillar-siblings">
            <h2 id="pillar-siblings" className="text-sm font-bold uppercase tracking-wide text-gray-400">
              {t("membre.piliers.detail.others", { group: groupTitle })}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {siblings.map((entry) => {
                const SiblingIcon = entry.Icon;
                return (
                  <Link
                    key={entry.id}
                    to={`/membre/piliers/${entry.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <SiblingIcon aria-hidden="true" className="size-4 text-gray-400" />
                    {getPillarText(entry, t).name}
                    <ChevronRightIcon aria-hidden="true" className="size-4 text-gray-300" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
