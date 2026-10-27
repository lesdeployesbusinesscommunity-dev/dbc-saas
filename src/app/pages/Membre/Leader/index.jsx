// Import Dependencies
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, ClipboardDocumentCheckIcon, MapPinIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { fullName } from "app/pages/Admin/Inscriptions/registrationUtils";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { DeadlineBadge, InterviewStageBadge } from "./DeadlineBadge";
import { LeaderShell } from "./LeaderShell";
import { summarizeDossiers, useLeaderDossiers } from "./leaderAccess";

// ----------------------------------------------------------------------

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className={clsx("mt-1 text-2xl font-extrabold", tone)}>{value}</p>
    </div>
  );
}

function DossierRow({ item }) {
  const { t } = useTranslation();
  const { registration, stage, deadline } = item;
  const name = fullName(registration);
  const active = stage === "todo" || stage === "unreachable";

  return (
    <li>
      <Link
        to={`/membre/leader/dossier/${registration.id}`}
        className="group flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:p-5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <Avatar name={name} size="size-12" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{registration.travail}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0 text-[#52A2DF]" />
              {[registration.ville, registration.pays].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <LevelBadge levelKey={registration.tontine} />
          <InterviewStageBadge stage={stage} />
          {active && <DeadlineBadge deadline={deadline} />}
        </div>

        <span className="flex items-center gap-1.5 text-xs font-bold text-[#EE7115]">
          {active ? t("membre.leader.interviews.card.open") : t("membre.leader.interviews.card.view")}
          <ArrowRightIcon aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

// Page d'accueil de l'Espace leader (/membre/leader) : les dossiers de
// candidature confiés par l'administration pour un ENTRETIEN. Chacun montre
// son délai (7 jours pour rendre le compte-rendu) ; ceux à mener passent en
// premier, les entretiens déjà rendus restent consultables dessous.
export default function LeaderInterviews() {
  const { t } = useTranslation();
  const dossiers = useLeaderDossiers();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("open");

  const summary = summarizeDossiers(dossiers);
  const closed = dossiers.length - summary.open;

  const visible = useMemo(() => {
    const text = normalizeSearchText(query);
    return dossiers
      .filter((item) => (filter === "open" ? item.stage === "todo" || item.stage === "unreachable" : filter === "closed" ? item.stage === "done" || item.stage === "refused" : true))
      .filter((item) => {
        if (!text) return true;
        const r = item.registration;
        return [fullName(r), r.ville, r.pays, r.travail, r.ref].map(normalizeSearchText).join(" ").includes(text);
      });
  }, [dossiers, filter, query]);

  const filters = [
    { key: "open", label: t("membre.leader.interviews.filter.open"), count: summary.open },
    { key: "closed", label: t("membre.leader.interviews.filter.closed"), count: closed },
    { key: "all", label: t("membre.leader.interviews.filter.all"), count: dossiers.length },
  ];

  return (
    <LeaderShell
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("membre.leader.interviews.searchPlaceholder")}
    >
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.interviews.subtitle")}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label={t("membre.leader.interviews.stats.open")} value={summary.open} tone="text-[#2f78b0]" />
        <StatTile
          label={t("membre.leader.interviews.stats.overdue")}
          value={summary.overdue}
          tone={summary.overdue > 0 ? "text-red-600" : "text-gray-900"}
        />
        <StatTile label={t("membre.leader.interviews.stats.closed")} value={closed} tone="text-green-700" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("membre.leader.interviews.filter.label")}>
        {filters.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === key ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
            )}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <ClipboardDocumentCheckIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t(`membre.leader.interviews.empty.${query ? "search" : filter}.title`)}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t(`membre.leader.interviews.empty.${query ? "search" : filter}.description`)}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((item) => (
            <DossierRow key={item.registration.id} item={item} />
          ))}
        </ul>
      )}
    </LeaderShell>
  );
}
