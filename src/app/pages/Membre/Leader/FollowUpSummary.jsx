// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Le rapport de relance rendu, en lecture seule : montré au chef d'antenne
// après l'envoi ET à l'administration, dans l'onglet "Relances" de Gestion des
// tontines.
export function FollowUpSummary({ report }) {
  const { t, i18n } = useTranslation();
  if (!report) return null;

  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const format = (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value));
  const reached = report.reachable;
  const Icon = reached ? CheckCircleIcon : ExclamationTriangleIcon;

  return (
    <div data-testid="followup-summary" className="space-y-3 text-sm">
      <div
        className={clsx(
          "flex items-start gap-2.5 rounded-xl p-3.5",
          reached ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700",
        )}
      >
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-bold">{t(`membre.leader.followUp.outcome.${reached ? "reached" : "unreachable"}`)}</p>
          <p className="text-xs opacity-80">
            {t("membre.leader.followUp.summary.by", {
              name: report.leaderName,
              date: format(report.at, { day: "numeric", month: "long", year: "numeric" }),
            })}
          </p>
        </div>
      </div>

      <p className="text-gray-600">
        <span className="font-semibold text-gray-800">{t("membre.leader.report.summary.mode")} : </span>
        {t(`membre.leader.report.mode.options.${report.mode}.label`)}
      </p>
      {reached && (
        <>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{t("membre.leader.followUp.summary.cause")} : </span>
            {t(`membre.leader.followUp.causes.${report.cause}`)}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{t("membre.leader.followUp.summary.solution")} : </span>
            {t(`membre.leader.followUp.solutions.${report.solution}.label`)}
            {report.promiseDate &&
              ` — ${t("membre.leader.followUp.summary.promise", {
                date: format(`${report.promiseDate}T12:00:00`, { day: "numeric", month: "long", year: "numeric" }),
              })}`}
          </p>
        </>
      )}
      {report.comment && (
        <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-gray-700">« {report.comment} »</p>
      )}
      {report.attempts > 1 && (
        <p className="text-xs text-gray-400">{t("membre.leader.followUp.summary.attempts", { count: report.attempts })}</p>
      )}
    </div>
  );
}
