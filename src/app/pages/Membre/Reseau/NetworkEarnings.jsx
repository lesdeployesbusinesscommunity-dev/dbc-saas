// Import Dependencies
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { BanknotesIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { getNetworkEarnings } from "./mockData";

// ----------------------------------------------------------------------

// "Gains de mon réseau" : ce que le réseau rapporte, avec les DEUX
// systèmes toujours nommés séparément (gains de parrainage DBC / commissions
// Longrich du mois, voir mockData.js : "getNetworkEarnings") pour ne jamais
// les additionner à tort. Les "meilleurs filleuls" reprennent les montants
// de Mon MLM ; le détail complet est un clic plus loin (lien vers Mon MLM).
export function NetworkEarnings() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const earnings = getNetworkEarnings();
  const maxCommission = Math.max(1, ...earnings.top.map((member) => member.commission));

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <BanknotesIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.reseau.earnings.title")}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-lg font-bold text-gray-900">{formatMoney(earnings.referralEarnings, locale)}</p>
          <p className="text-xs font-medium text-gray-500">{t("membre.reseau.earnings.referral")}</p>
        </div>
        <div className="rounded-2xl bg-[#52A2DF]/[0.1] p-4">
          <p className="text-lg font-bold text-gray-900">{formatMoney(earnings.mlmCommissions, locale)}</p>
          <p className="text-xs font-medium text-gray-500">{t("membre.reseau.earnings.mlm")}</p>
        </div>
      </div>

      {earnings.top.length > 0 && (
        <>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
            {t("membre.reseau.earnings.top")}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {earnings.top.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: LEVEL_HEX[member.levelKey] }}
                >
                  {getInitials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                    <span className="shrink-0 text-sm font-bold text-gray-900">{formatMoney(member.commission, locale)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((member.commission / maxCommission) * 100)}%`, backgroundColor: LEVEL_HEX[member.levelKey] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Link
        to="/membre/mlm"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f78b4] hover:underline"
      >
        {t("membre.reseau.earnings.seeMlm")}
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}
