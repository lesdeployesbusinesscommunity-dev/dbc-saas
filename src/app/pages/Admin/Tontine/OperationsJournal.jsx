// Import Dependencies
import { useState } from "react";
import clsx from "clsx";

// Local Imports
import { JOURNAL_TYPES, totalsOf, useLedgerTitle, operationLabel } from "./registreUtils";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const PAGE_SIZE = 40;

function Segmented({ label, options, value, onChange, renderLabel }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
      {options.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            value === key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50",
          )}
        >
          {renderLabel(key)}
        </button>
      ))}
    </div>
  );
}

// Les filtres du journal : type d'opération, groupe, et période.
export function JournalFilters({ filters, onChange, ledgers, monthLabel }) {
  const { t } = useTontineFormat();
  const titleOf = useLedgerTitle();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        label={t("admin.tontine.registre.journal.type")}
        options={JOURNAL_TYPES}
        value={filters.type}
        onChange={(type) => onChange({ ...filters, type })}
        renderLabel={(key) => t(`admin.tontine.registre.journal.types.${key}`)}
      />
      <Segmented
        label={t("admin.tontine.registre.journal.period")}
        options={["month", "all"]}
        value={filters.scope}
        onChange={(scope) => onChange({ ...filters, scope })}
        renderLabel={(key) =>
          key === "month" ? monthLabel : t("admin.tontine.registre.journal.allMonths")
        }
      />
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <span className="sr-only sm:not-sr-only">{t("admin.tontine.registre.journal.group")}</span>
        <select
          value={filters.ledgerKey}
          onChange={(event) => onChange({ ...filters, ledgerKey: event.target.value })}
          className="max-w-56 rounded-full border-0 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 focus:ring-2 focus:ring-[#52A2DF]"
        >
          <option value="all">{t("admin.tontine.registre.journal.allGroups")}</option>
          {ledgers.map((ledger) => (
            <option key={ledger.key} value={ledger.key}>
              {titleOf(ledger)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

// Le JOURNAL : toutes les opérations rangées par date, comme dans un cahier de
// comptes — ce qui est entré (Reçu), ce qui est sorti (Versé : la cagnotte) et
// ce qui n'a pas été payé (Impayé). Les totaux sont en bas.
export function OperationsTable({ operations, monthName }) {
  const { t, locale } = useTontineFormat();
  const titleOf = useLedgerTitle();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const num = (value) => value.toLocaleString(locale);
  const totals = totalsOf(operations);
  const shown = operations.slice(0, limit);

  if (operations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-gray-500">
        {t("admin.tontine.registre.journal.empty")}
      </p>
    );
  }

  const head = "border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500";
  const cell = "border-b border-gray-100 px-3 py-2 text-sm";
  const amount = (value, tone) => (
    <td className={clsx(cell, "whitespace-nowrap text-right tabular-nums", value ? tone : "text-gray-300")}>
      {value ? num(value) : "—"}
    </td>
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
          <caption className="sr-only">{t("admin.tontine.registre.journal.title")}</caption>
          <thead>
            <tr>
              <th scope="col" className={head}>{t("admin.tontine.registre.journal.date")}</th>
              <th scope="col" className={head}>{t("admin.tontine.registre.journal.member")}</th>
              <th scope="col" className={head}>{t("admin.tontine.registre.journal.group")}</th>
              <th scope="col" className={head}>{t("admin.tontine.registre.journal.label")}</th>
              <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.journal.in")}</th>
              <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.journal.out")}</th>
              <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.journal.due")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((operation, index) => (
              <tr key={operation.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                <td className={clsx(cell, "whitespace-nowrap tabular-nums text-gray-600")}>
                  {operation.date.format("DD/MM/YYYY")}
                </td>
                <th scope="row" className={clsx(cell, "whitespace-nowrap font-medium text-gray-900")}>
                  {operation.name}
                </th>
                <td className={clsx(cell, "whitespace-nowrap text-gray-600")}>
                  {titleOf({ levelKey: operation.levelKey, kind: operation.letter ? "group" : "waiting", letter: operation.letter })}
                </td>
                <td className={clsx(cell, "text-gray-700")}>{operationLabel(t, operation, monthName)}</td>
                {amount(operation.kind === "in" ? operation.amount : 0, "text-gray-900")}
                {amount(operation.kind === "out" ? operation.amount : 0, "text-gray-900")}
                {amount(operation.kind === "due" ? operation.amount : 0, "font-semibold text-red-600")}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-gray-900">
              <th scope="row" colSpan={4} className="border-t border-gray-300 px-3 py-2.5 text-left text-sm">
                {t("admin.tontine.registre.journal.total", { count: operations.length })}
              </th>
              <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">{num(totals.in)}</td>
              <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">{num(totals.out)}</td>
              <td className={clsx("border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums", totals.due > 0 && "text-red-600")}>
                {num(totals.due)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <p>{t("admin.tontine.registre.journal.shown", { shown: shown.length, total: operations.length })}</p>
        {operations.length > shown.length && (
          <button
            type="button"
            onClick={() => setLimit((current) => current + PAGE_SIZE)}
            className="rounded-full bg-white px-4 py-1.5 font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
          >
            {t("admin.tontine.registre.journal.more", { count: Math.min(PAGE_SIZE, operations.length - shown.length) })}
          </button>
        )}
      </div>
    </div>
  );
}

