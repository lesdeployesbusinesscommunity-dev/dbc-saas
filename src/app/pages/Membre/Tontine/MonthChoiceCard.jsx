// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, TrophyIcon } from "@heroicons/react/24/solid";

// Local Imports
import { useMonthLabels } from "app/pages/Admin/components/monthUtils";
import {
  CHOICES,
  campaignsFor,
  choiceRank,
  isPastDeadline,
  saveResponse,
  useMonthChoices,
} from "app/pages/Admin/Tontine/monthChoices";
import { currentMember } from "../currentMember";

// ----------------------------------------------------------------------

// "Choisis tes 3 mois" : c'est l'ADMINISTRATION qui décide de l'ordre de
// passage ("qui reçoit la cagnotte quel mois"). Quand elle prépare un
// nouveau groupe, elle envoie à chaque futur membre une demande (cette carte,
// plus un rappel par e-mail et WhatsApp) : choisis 3 mois dans la période
// proposée, du plus souhaité au moins souhaité. Elle tient compte des choix de
// tout le groupe pour attribuer un mois différent à chacun, puis valide
// l'ordre — le mois attribué s'affiche alors ici. La carte n'apparaît que
// s'il y a une demande pour moi (voir Admin/Tontine/monthChoices.js).
export function MonthChoiceCard() {
  const choices = useMonthChoices();
  const mine = campaignsFor(choices, currentMember.matricule);
  if (mine.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      {mine.map((campaign) => (
        <CampaignChoice key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

function CampaignChoice({ campaign }) {
  const { t, i18n } = useTranslation();
  const { monthYear } = useMonthLabels();
  const matricule = currentMember.matricule;
  const response = campaign.responses[matricule];
  const wanted = Math.min(CHOICES, campaign.months.length);

  // Les mois choisis, dans l'ordre de préférence (le 1er est le plus souhaité).
  const [picked, setPicked] = useState(response?.months ?? []);
  const [failed, setFailed] = useState(false);

  const validated = campaign.status === "validated";
  const open = campaign.status === "open" && !isPastDeadline(campaign);
  const level = t(`simulateur.levels.${campaign.levelKey}.name`);
  const deadline = new Intl.DateTimeFormat(i18n.language?.startsWith("fr") ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${campaign.deadline}T12:00:00`),
  );

  const toggle = (month) => {
    setFailed(false);
    setPicked((current) => {
      if (current.includes(month)) return current.filter((value) => value !== month);
      return current.length >= wanted ? current : [...current, month];
    });
  };

  const submit = () => {
    const ok = saveResponse(campaign.id, matricule, picked);
    setFailed(!ok);
  };

  const unchanged = Boolean(response) && response.months.join() === picked.join();

  return (
    <section
      aria-labelledby={`choice-${campaign.id}`}
      className="rounded-2xl border border-[#EE7115]/25 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EE7115]/[0.1] text-[#EE7115]">
            {validated ? (
              <TrophyIcon aria-hidden="true" className="size-5" />
            ) : (
              <CalendarDaysIcon aria-hidden="true" className="size-5" />
            )}
          </span>
          <div>
            <h2 id={`choice-${campaign.id}`} className="text-sm font-bold text-gray-900">
              {validated
                ? t("membre.tontine.monthChoice.resultTitle", { level })
                : t("membre.tontine.monthChoice.title", { count: wanted })}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {t("membre.tontine.monthChoice.period", {
                level,
                from: monthYear(campaign.months[0]),
                to: monthYear(campaign.months[campaign.months.length - 1]),
              })}
            </p>
          </div>
        </div>
        {open && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            <ClockIcon aria-hidden="true" className="size-3.5" />
            {t("membre.tontine.monthChoice.deadline", { date: deadline })}
          </span>
        )}
      </div>

      {validated ? (
        <Result campaign={campaign} />
      ) : open ? (
        <>
          {campaign.message && (
            <blockquote className="mt-4 whitespace-pre-line rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                {t("membre.tontine.monthChoice.fromAdmin")}
              </span>
              {campaign.message}
            </blockquote>
          )}

          <p className="mt-4 text-sm text-gray-600">{t("membre.tontine.monthChoice.hint", { count: wanted })}</p>

          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {campaign.months.map((month) => {
              const rank = picked.indexOf(month) + 1;
              const disabled = rank === 0 && picked.length >= wanted;
              return (
                <li key={month}>
                  <button
                    type="button"
                    onClick={() => toggle(month)}
                    disabled={disabled}
                    aria-pressed={rank > 0}
                    className={clsx(
                      "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      rank > 0
                        ? "border-[#EE7115] bg-[#EE7115]/[0.06] text-gray-900"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                      disabled && "cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-transparent",
                    )}
                  >
                    <span>{monthYear(month)}</span>
                    {rank > 0 && (
                      <span
                        title={t("membre.tontine.monthChoice.rank", { n: rank })}
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EE7115] text-[11px] font-bold text-white"
                      >
                        {rank}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-gray-500">
              {t("membre.tontine.monthChoice.progress", { count: picked.length, total: wanted })}
            </p>
            <div className="flex items-center gap-3">
              {picked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  {t("membre.tontine.monthChoice.clear")}
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={picked.length !== wanted || unchanged}
                className="rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {response ? t("membre.tontine.monthChoice.update") : t("membre.tontine.monthChoice.send")}
              </button>
            </div>
          </div>

          <div role="status" aria-live="polite">
            {unchanged && !failed && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
                <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t("membre.tontine.monthChoice.saved", {
                    months: picked.map((month) => monthYear(month)).join(", "),
                  })}
                </span>
              </p>
            )}
            {failed && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                {t("membre.tontine.monthChoice.failed")}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          {response
            ? t("membre.tontine.monthChoice.closedAnswered", {
                months: response.months.map((month) => monthYear(month)).join(", "),
              })
            : t("membre.tontine.monthChoice.closedNoAnswer")}
        </p>
      )}
    </section>
  );
}

// L'ordre est validé : le mois attribué, et s'il correspond à un des choix.
function Result({ campaign }) {
  const { t } = useTranslation();
  const { monthYear } = useMonthLabels();
  const month = campaign.order[currentMember.matricule];

  if (!month) {
    return <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">{t("membre.tontine.monthChoice.noMonth")}</p>;
  }

  const rank = choiceRank(campaign, currentMember.matricule);
  return (
    <div className="mt-4 rounded-xl bg-[#EE7115]/[0.06] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {t("membre.tontine.monthChoice.yourMonth")}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-900">{monthYear(month)}</p>
      <p className="mt-1 text-sm text-gray-600">
        {rank === null ? t("membre.tontine.monthChoice.rankNone") : t(`membre.tontine.monthChoice.rankResult.${rank}`)}
      </p>
    </div>
  );
}
