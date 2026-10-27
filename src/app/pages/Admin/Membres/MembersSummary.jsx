// Import Dependencies
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Cartes de synthèse en haut de page : chacune est un raccourci qui filtre
// la liste (ou ouvre l'onglet Leaders). La carte "En attente" est mise en
// avant quand il y a des membres à activer.
export function MembersSummary({ counts, activeKey, onSelect }) {
  const { t } = useTranslation();

  const cards = [
    { key: "all", Icon: UsersIcon, value: counts.total, tone: "bg-blue-50 text-[#52A2DF]" },
    { key: "actif", Icon: CheckCircleIcon, value: counts.actif, tone: "bg-green-50 text-green-600" },
    { key: "attente", Icon: ClockIcon, value: counts.attente, tone: "bg-amber-50 text-amber-600" },
    { key: "desactive", Icon: NoSymbolIcon, value: counts.desactive, tone: "bg-red-50 text-red-600" },
    { key: "leader", Icon: ShieldCheckIcon, value: counts.leaders, tone: "bg-orange-50 text-[#EE7115]" },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ key, Icon, value, tone }) => {
        const isActive = activeKey === key;
        const highlight = key === "attente" && value > 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isActive}
            className={clsx(
              "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-200",
              isActive ? "border-[#52A2DF] ring-1 ring-[#52A2DF]/30" : "border-gray-100",
              highlight && !isActive && "border-amber-200",
            )}
          >
            <span className={clsx("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-bold leading-tight text-gray-900">{value}</span>
              <span className="block truncate text-xs font-medium text-gray-500">
                {t(`admin.membres.summary.${key}`)}
              </span>
              {highlight && (
                <span className="block truncate text-[11px] font-semibold text-amber-600">
                  {t("admin.membres.summary.toActivate")}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
