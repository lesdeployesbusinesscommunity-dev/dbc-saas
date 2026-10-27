// Import Dependencies
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { AdminTopBar } from "../components/AdminTopBar";
import { normalizeSearchText } from "../searchUtils";
import { LedgerBook, LedgerSummary } from "./LedgerBook";
import { MemberStatementModal } from "./MemberStatementModal";
import { MonthBalance } from "./MonthBalance";
import { JournalFilters, OperationsTable } from "./OperationsJournal";
import { TontineGuide } from "./guide/TontineGuide";
import { useRegistre } from "./registreData";
import { downloadCsv, filterOperations, operationLabel, slugify, useLedgerTitle } from "./registreUtils";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const TABS = ["livre", "journal"];

// Page "Registre des cotisations" (/admin/tontine/cotisations) : le cahier de
// comptes de la tontine. Un MOIS à la fois, deux lectures :
//  - le grand livre : la balance du mois (un groupe par ligne) puis le livre du
//    groupe choisi (un membre par ligne, un mois par colonne) ;
//  - le journal : toutes les opérations par date (reçu, versé, impayé).
// Un clic sur un membre ouvre sa fiche de compte. L'admin ne valide rien : un
// paiement s'inscrit dès qu'il est reçu. Données de démonstration (voir
// registreData.js), en attendant le backend.
export default function Cotisations() {
  const { t, month, monthName } = useTontineFormat();
  const { i18n } = useTranslation();
  const titleOf = useLedgerTitle();
  const registre = useRegistre();
  const { ledgers, months, operations, currentMonth } = registre;

  const [params, setParams] = useSearchParams();
  const tab = params.get("onglet") === "journal" ? "journal" : "livre";
  const setTab = (next) => {
    const copy = new URLSearchParams(params);
    if (next === "livre") copy.delete("onglet");
    else copy.set("onglet", next);
    setParams(copy, { replace: true });
  };

  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(months.includes(currentMonth) ? currentMonth : months.at(-1));
  const [ledgerKey, setLedgerKey] = useState(null);
  const [opened, setOpened] = useState(null); // { ledgerKey, rowId }
  const [filters, setFilters] = useState({ type: "all", ledgerKey: "all", scope: "month" });

  const monthValue = months.includes(picked) ? picked : (months.at(-1) ?? currentMonth);
  const monthIndex = months.indexOf(monthValue);
  const labelOf = (value) => month(dayjs(`${value}-01`));
  // Le nom du mois seul, en minuscules en français ("septembre"), pour les libellés.
  const nameOf = (value) => {
    const name = monthName(dayjs(`${value}-01`));
    return i18n.language?.startsWith("fr") ? name.toLowerCase() : name;
  };

  const query = normalizeSearchText(search);

  const balanceKeys = ledgers.filter((ledger) => ledger.columns.some((c) => c.monthValue === monthValue && c.status !== "upcoming"));
  const activeKey =
    ledgerKey && ledgers.some((ledger) => ledger.key === ledgerKey) ? ledgerKey : (balanceKeys[0]?.key ?? ledgers[0]?.key);
  const active = ledgers.find((ledger) => ledger.key === activeKey);

  const matchesRow = query === "" ? null : (row) => normalizeSearchText(row.name).includes(query);
  const matchesOperation =
    query === ""
      ? null
      : (operation) =>
          normalizeSearchText(operation.name).includes(query) ||
          normalizeSearchText(titleOf({ levelKey: operation.levelKey, kind: operation.letter ? "group" : "waiting", letter: operation.letter })).includes(query);

  const journalOperations = useMemo(
    () => filterOperations(operations, { ...filters, monthValue, matches: matchesOperation }),
    // matchesOperation dépend de "query" : on liste la valeur, pas la fonction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [operations, filters, monthValue, query],
  );

  const openedLedger = opened ? ledgers.find((ledger) => ledger.key === opened.ledgerKey) : null;
  const openedRow = openedLedger?.rows.find((row) => row.id === opened.rowId);

  const exportCsv = () => {
    if (tab === "journal") {
      const rows = [
        ["Date", t("admin.tontine.registre.journal.member"), t("admin.tontine.registre.journal.group"), t("admin.tontine.registre.journal.label"), t("admin.tontine.registre.journal.in"), t("admin.tontine.registre.journal.out"), t("admin.tontine.registre.journal.due")],
        ...journalOperations.map((operation) => [
          operation.date.format("DD/MM/YYYY"),
          operation.name,
          titleOf({ levelKey: operation.levelKey, kind: operation.letter ? "group" : "waiting", letter: operation.letter }),
          operationLabel(t, operation, nameOf),
          operation.kind === "in" ? operation.amount : "",
          operation.kind === "out" ? operation.amount : "",
          operation.kind === "due" ? operation.amount : "",
        ]),
      ];
      downloadCsv(`journal-${filters.scope === "month" ? monthValue : "tous-les-mois"}.csv`, rows);
      return;
    }
    if (!active) return;
    const stateText = (state) => ({ unpaid: t("admin.tontine.registre.cell.unpaid"), late: t("admin.tontine.registre.cell.late"), awaiting: t("admin.tontine.registre.cell.awaiting") })[state] ?? "";
    const rows = [
      [t("admin.tontine.registre.book.member"), t("admin.tontine.registre.csv.city"), ...active.columns.map((column) => column.month.format("MM/YYYY")), t("admin.tontine.registre.book.totalPaid"), t("admin.tontine.registre.book.owed")],
      ...active.rows.map((row) => [
        row.name,
        row.city,
        ...row.cells.map((state) => (state === "paid" ? active.cotisation : stateText(state))),
        row.totalPaid,
        row.owed,
      ]),
    ];
    downloadCsv(`grand-livre-${slugify(titleOf(active))}.csv`, rows);
  };

  const step = (delta) => setPicked(months[monthIndex + delta]);

  return (
    <Page title={`Admin – ${t("admin.tontine.registre.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.tontine.registre.title")}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("admin.tontine.registre.searchPlaceholder")}
        />

        <Link
          to="/admin/tontine"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          {t("admin.tontine.registre.back")}
        </Link>
        <p className="mt-2 max-w-3xl text-sm text-gray-500">{t("admin.tontine.registre.intro")}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t("admin.tontine.registre.tabsLabel")} className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  tab === key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {t(`admin.tontine.registre.tabs.${key}`)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={monthIndex <= 0}
                aria-label={t("admin.tontine.registre.month.prev")}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeftIcon aria-hidden="true" className="size-4" />
              </button>
              <label className="sr-only" htmlFor="registre-month">{t("admin.tontine.registre.month.label")}</label>
              <select
                id="registre-month"
                value={monthValue}
                onChange={(event) => setPicked(event.target.value)}
                className="border-0 bg-transparent py-1.5 pl-2 pr-8 text-sm font-semibold text-gray-900 focus:ring-0"
              >
                {[...months].reverse().map((value) => (
                  <option key={value} value={value}>
                    {labelOf(value)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={monthIndex >= months.length - 1}
                aria-label={t("admin.tontine.registre.month.next")}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
            {monthValue !== currentMonth && months.includes(currentMonth) && (
              <button
                type="button"
                onClick={() => setPicked(currentMonth)}
                className="text-xs font-semibold text-[#52A2DF] hover:underline"
              >
                {t("admin.tontine.registre.month.current")}
              </button>
            )}
            <TontineGuide voice="admin" startAt="ledger" className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50" />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
            >
              <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
              {t("admin.tontine.registre.export")}
            </button>
          </div>
        </div>

        {tab === "livre" ? (
          <div role="tabpanel" className="mt-6 space-y-8">
            <section aria-labelledby="registre-balance">
              <h2 id="registre-balance" className="text-base font-bold text-gray-900">
                {t("admin.tontine.registre.balance.title")} · {labelOf(monthValue)}
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-gray-500">{t("admin.tontine.registre.balance.hint")}</p>
              <MonthBalance ledgers={ledgers} monthValue={monthValue} selectedKey={activeKey} onSelect={setLedgerKey} />
            </section>

            {active && (
              <section aria-labelledby="registre-book" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 id="registre-book" className="text-base font-bold text-gray-900">
                    {t("admin.tontine.registre.book.title")}
                  </h2>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    {t("admin.tontine.registre.book.group")}
                    <select
                      value={activeKey}
                      onChange={(event) => setLedgerKey(event.target.value)}
                      className="max-w-64 rounded-full border-0 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 focus:ring-2 focus:ring-[#52A2DF]"
                    >
                      {levels
                        .filter((level) => ledgers.some((ledger) => ledger.levelKey === level.key))
                        .map((level) => (
                          <optgroup key={level.key} label={t(`simulateur.levels.${level.key}.name`)}>
                            {ledgers
                              .filter((ledger) => ledger.levelKey === level.key)
                              .map((ledger) => (
                                <option key={ledger.key} value={ledger.key}>
                                  {titleOf(ledger)}
                                  {ledger.groupStatus === "complete" ? ` (${t("admin.tontine.registre.complete")})` : ""}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                    </select>
                  </label>
                </div>
                <LedgerSummary ledger={active} monthValue={monthValue} />
                <LedgerBook
                  ledger={active}
                  monthValue={monthValue}
                  matches={matchesRow}
                  onOpenMember={(row) => setOpened({ ledgerKey: active.key, rowId: row.id })}
                />
              </section>
            )}
          </div>
        ) : (
          <div role="tabpanel" className="mt-6 space-y-4">
            <JournalFilters filters={filters} onChange={setFilters} ledgers={ledgers} monthLabel={labelOf(monthValue)} />
            <OperationsTable
              key={`${filters.type}|${filters.ledgerKey}|${filters.scope}|${monthValue}|${query}`}
              operations={journalOperations}
              monthName={nameOf}
            />
          </div>
        )}
      </div>

      {openedRow && (
        <MemberStatementModal
          ledger={openedLedger}
          row={openedRow}
          operations={operations}
          monthName={nameOf}
          onClose={() => setOpened(null)}
        />
      )}
    </Page>
  );
}
