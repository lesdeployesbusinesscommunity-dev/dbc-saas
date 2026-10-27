// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { CRITERIA } from "./interviewModel";

// ----------------------------------------------------------------------

const RATING_STYLE = {
  yes: "bg-green-50 text-green-700 ring-green-600/25",
  medium: "bg-amber-50 text-amber-700 ring-amber-400/40",
  no: "bg-red-50 text-red-600 ring-red-200",
};

const DECISION_STYLE = {
  concluant: { Icon: CheckCircleIcon, className: "bg-green-50 text-green-700" },
  nonConcluant: { Icon: XCircleIcon, className: "bg-gray-100 text-gray-600" },
  injoignable: { Icon: ExclamationTriangleIcon, className: "bg-amber-50 text-amber-700" },
};

// Le compte-rendu rendu, en lecture seule : la décision, le mode, les cinq
// points notés, les signaux d'alerte, les raisons et le commentaire. Montré
// au leader après l'envoi ET à l'administration dans le dossier du candidat.
export function ReportSummary({ report }) {
  const { t, i18n } = useTranslation();
  if (!report) return null;

  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(report.at),
  );
  const { Icon, className } = DECISION_STYLE[report.decision] ?? DECISION_STYLE.injoignable;

  return (
    <div data-testid="report-summary" className="space-y-4 text-sm">
      <div className={clsx("flex items-start gap-2.5 rounded-xl p-3.5", className)}>
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-bold">{t(`membre.leader.report.decision.${report.decision}`)}</p>
          <p className="text-xs opacity-80">
            {t("membre.leader.report.summary.by", { name: report.leaderName, date })}
          </p>
        </div>
      </div>

      <p className="text-gray-600">
        <span className="font-semibold text-gray-800">{t("membre.leader.report.summary.mode")} : </span>
        {t(`membre.leader.report.mode.options.${report.mode}.label`)}
      </p>

      {report.reachable && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {CRITERIA.map((key) => (
            <li key={key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-gray-700">{t(`membre.leader.report.criteria.items.${key}.label`)}</span>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                  RATING_STYLE[report.ratings[key]],
                )}
              >
                {t(`membre.leader.report.ratings.${report.ratings[key]}`)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {report.flags?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            {t("membre.leader.report.summary.flags")}
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-gray-700">
            {report.flags.map((flag) => (
              <li key={flag}>{t(`membre.leader.report.flags.items.${flag}`)}</li>
            ))}
          </ul>
        </div>
      )}

      {report.reasons?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("membre.leader.report.summary.reasons")}
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-gray-700">
            {report.reasons.map((reason) => (
              <li key={reason}>{t(`membre.leader.report.reasons.items.${reason}`)}</li>
            ))}
          </ul>
        </div>
      )}

      {report.comment && (
        <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 italic text-gray-600">« {report.comment} »</p>
      )}
    </div>
  );
}
