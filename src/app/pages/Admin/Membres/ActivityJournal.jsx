// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { normalizeSearchText } from "../searchUtils";
import { EventItem } from "./MemberTimeline";
import { Pagination } from "./Pagination";
import { useEventDescriber } from "./journalFormat";
import { useMembersFormat } from "./useMembersFormat";

// ----------------------------------------------------------------------

const PAGE_SIZE = 10;
const LEADER_TYPES = ["leaderAppointed", "leaderUpdated", "leaderDismissed"];

// Onglet "Journal" : tout ce qui est fait sur les membres et les leaders,
// du plus récent au plus ancien. Filtrable par catégorie et par nom /
// matricule, exportable en CSV (les lignes exportées sont celles du
// filtre en cours).
export function ActivityJournal({ events, onOpenMember, existingIds }) {
  const { t } = useTranslation();
  const describe = useEventDescriber();
  const { dateTime } = useMembersFormat();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = normalizeSearchText(search);
    return [...events]
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter((event) => {
        if (category === "leaders" && !LEADER_TYPES.includes(event.type)) return false;
        if (category === "members" && LEADER_TYPES.includes(event.type)) return false;
        if (!query) return true;
        return (
          normalizeSearchText(event.name).includes(query) ||
          normalizeSearchText(event.matricule).includes(query)
        );
      });
  }, [events, category, search]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const headers = [
      t("admin.membres.journal.columns.date"),
      t("admin.membres.table.columns.matricule"),
      t("admin.membres.table.columns.name"),
      t("admin.membres.journal.columns.action"),
      t("admin.membres.journal.columns.detail"),
      t("admin.membres.journal.columns.by"),
    ];
    const rows = filtered.map((event) => {
      const { title, detail } = describe(event);
      return [dateTime(event.at), event.matricule, event.name, title, detail, event.by ?? ""];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "journal-membres.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { value: "all", label: t("admin.membres.journal.all") },
    { value: "members", label: t("admin.membres.journal.members") },
    { value: "leaders", label: t("admin.membres.journal.leaders") },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{t("admin.membres.journal.title")}</h2>
          <p className="text-xs text-gray-400">{t("admin.membres.journal.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
          {t("admin.membres.export")}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                category === item.value
                  ? "bg-[#52A2DF] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.membres.searchPlaceholder")}
            className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#52A2DF]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 py-10 text-center text-sm text-gray-500">{t("admin.membres.journal.empty")}</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
            {visible.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                showMember
                onOpenMember={existingIds.has(event.memberId) ? onOpenMember : undefined}
              />
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </div>
  );
}
