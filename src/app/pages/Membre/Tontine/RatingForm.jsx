// Import Dependencies
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ClockIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";

// Local Imports
import { listMembers, logMemberEvent, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { useTontineFormat } from "app/pages/Admin/Tontine/format";
import { RATING_ASPECTS, RATING_HOURS, averageOf, ratingState } from "app/pages/Admin/Tontine/priorityScore";
import { submitRating, usePriorityStore } from "app/pages/Admin/Tontine/priorityStore";
import { currentMember } from "../currentMember";

// ----------------------------------------------------------------------

const SCALE = Array.from({ length: 11 }, (_, i) => i);

function RatingCard({ keyId, record }) {
  const { t } = useTranslation();
  const { day } = useTontineFormat();
  const membersSnapshot = useMembersStore();
  const [aspects, setAspects] = useState({});
  const average = averageOf(aspects);
  const hoursLeft = Math.max(1, Math.ceil((new Date(record.dueAt).getTime() - Date.now()) / 3600000));
  const due = dayjs(record.dueAt);

  const submit = (event) => {
    event.preventDefault();
    if (average == null) return;
    submitRating(keyId, aspects);
    const filleul = listMembers(membersSnapshot).find(
      (person) => normalizeSearchText(person.name) === normalizeSearchText(record.name),
    );
    if (filleul) logMemberEvent(filleul.id, "priorityRated", { average }, currentMember.name);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <HandThumbUpIcon aria-hidden="true" className="size-5 text-emerald-600" />
            {t("tontinePriority.rating.title", { name: record.name })}
          </h3>
          <p className="mt-1 max-w-xl text-xs text-gray-500">{t("tontinePriority.rating.intro")}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
          <ClockIcon aria-hidden="true" className="size-3.5" />
          {t("tontinePriority.rating.left", { hours: hoursLeft, date: `${day(due)} ${due.format("HH:mm")}` })}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {RATING_ASPECTS.map((aspect) => (
          <fieldset key={aspect}>
            <legend className="text-sm font-semibold text-gray-800">{t(`tontinePriority.rating.aspects.${aspect}.label`)}</legend>
            <p className="text-xs text-gray-500">{t(`tontinePriority.rating.aspects.${aspect}.hint`)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCALE.map((value) => (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name={`${keyId}-${aspect}`}
                    value={value}
                    checked={aspects[aspect] === value}
                    onChange={() => setAspects((current) => ({ ...current, [aspect]: value }))}
                    className="peer sr-only"
                  />
                  <span
                    className={clsx(
                      "flex size-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold tabular-nums transition-colors",
                      "border-gray-200 text-gray-600 hover:bg-gray-50 peer-checked:border-[#EE7115] peer-checked:bg-[#EE7115] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#52A2DF]",
                    )}
                  >
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          {average == null
            ? t("tontinePriority.rating.incomplete")
            : t("tontinePriority.rating.average", { average: String(average).replace(".", ","), points: Math.round(average) })}
        </p>
        <button
          type="submit"
          disabled={average == null}
          className="rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("tontinePriority.rating.submit")}
        </button>
      </div>
    </form>
  );
}

// « Notes à donner » : les filleuls que je dois noter en tant que mentor-parrain.
// Chaque demande vient d'être créée d'office (voir Admin/Tontine/ratingEngine.js) ;
// j'ai 72 h pour la remplir, avec des rappels automatiques. La moyenne des quatre
// notes donne les points du critère « Recommandation » de mon filleul.
export function RatingRequests() {
  const { t } = useTranslation();
  const priority = usePriorityStore();
  const mine = useMemo(
    () =>
      Object.entries(priority.ratings)
        .filter(([, record]) => record.sponsorMatricule === currentMember.matricule && ratingState(record) === "pending")
        .sort((a, b) => a[1].dueAt.localeCompare(b[1].dueAt)),
    // "priority" suffit : currentMember est lu au moment du rendu.
    [priority],
  );
  if (mine.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      <p className="text-sm font-bold text-gray-900">
        {t("tontinePriority.rating.sectionTitle", { count: mine.length, hours: RATING_HOURS })}
      </p>
      {mine.map(([key, record]) => (
        <RatingCard key={`${key}-${record.dueAt}`} keyId={key} record={record} />
      ))}
    </div>
  );
}
