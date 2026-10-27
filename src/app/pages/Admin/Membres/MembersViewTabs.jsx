// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Les trois vues de la page : liste des membres, leaders, journal.
export function MembersViewTabs({ view, onChange, counts }) {
  const { t } = useTranslation();
  const tabs = [
    { value: "members", count: counts.members },
    { value: "leaders", count: counts.leaders },
    { value: "journal", count: counts.journal },
  ];

  return (
    <div role="tablist" aria-label={t("admin.membres.views.label")} className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = view === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4",
              isActive
                ? "border-[#EE7115] text-[#EE7115]"
                : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {t(`admin.membres.views.${tab.value}`)}
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                isActive ? "bg-orange-50 text-[#EE7115]" : "bg-gray-100 text-gray-500",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
