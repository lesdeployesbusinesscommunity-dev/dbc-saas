// Import Dependencies
import clsx from "clsx";

// Local Imports
import { LevelBadge } from "./LevelBadge";
import { monthFigures } from "./registreData";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

// La "balance du mois" : une ligne par registre (groupe ou membres sans
// groupe) avec ce qui était attendu, ce qui est rentré, ce qui reste à
// recouvrer et les cagnottes versées. Un clic sur une ligne ouvre le livre du
// groupe juste en dessous. La dernière ligne totalise tout.
export function MonthBalance({ ledgers, monthValue, selectedKey, onSelect }) {
  const { t, locale } = useTontineFormat();
  const num = (value) => value.toLocaleString(locale);

  const rows = ledgers
    .map((ledger) => ({ ledger, figures: monthFigures(ledger, monthValue) }))
    .filter((entry) => entry.figures);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-center text-sm text-gray-500">
        {t("admin.tontine.registre.balance.empty")}
      </p>
    );
  }

  const sum = (pick) => rows.reduce((total, entry) => total + pick(entry.figures), 0);
  const total = {
    size: sum((f) => f.size),
    paidCount: sum((f) => f.paidCount),
    expected: sum((f) => f.expected),
    received: sum((f) => f.received),
    outstanding: sum((f) => f.outstanding),
    payoutCount: sum((f) => f.payoutCount),
    payoutsDone: sum((f) => f.payoutsDone),
  };
  const totalRate = total.expected > 0 ? Math.round((total.received / total.expected) * 100) : 0;

  const head = "border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500";
  const cell = "border-b border-gray-100 px-3 py-2.5 text-sm tabular-nums";

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
        <caption className="sr-only">{t("admin.tontine.registre.balance.title")}</caption>
        <thead>
          <tr>
            <th scope="col" className={head}>{t("admin.tontine.registre.balance.group")}</th>
            <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.balance.payers")}</th>
            <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.balance.expected")}</th>
            <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.balance.received")}</th>
            <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.balance.outstanding")}</th>
            <th scope="col" className={clsx(head, "w-36")}>{t("admin.tontine.registre.balance.rate")}</th>
            <th scope="col" className={clsx(head, "text-right")}>{t("admin.tontine.registre.balance.payouts")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ledger, figures }) => {
            const selected = ledger.key === selectedKey;
            return (
              <tr
                key={ledger.key}
                onClick={() => onSelect(ledger.key)}
                className={clsx("cursor-pointer transition-colors", selected ? "bg-[#52A2DF]/[0.08]" : "hover:bg-gray-50")}
              >
                <th scope="row" className={clsx(cell, "font-medium text-gray-900")}>
                  <button
                    type="button"
                    onClick={() => onSelect(ledger.key)}
                    aria-pressed={selected}
                    className="flex items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52A2DF]"
                  >
                    <LevelBadge levelKey={ledger.levelKey} />
                    <span className="whitespace-nowrap">
                      {ledger.kind === "waiting" ? t("admin.tontine.registre.noGroup") : t("admin.tontine.group", { letter: ledger.letter })}
                    </span>
                    {ledger.groupStatus === "complete" && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                        {t("admin.tontine.registre.complete")}
                      </span>
                    )}
                  </button>
                </th>
                <td className={clsx(cell, "text-right text-gray-700")}>
                  {t("admin.tontine.registre.balance.payersValue", { paid: figures.paidCount, size: figures.size })}
                </td>
                <td className={clsx(cell, "text-right text-gray-700")}>{num(figures.expected)}</td>
                <td className={clsx(cell, "text-right text-gray-900")}>{num(figures.received)}</td>
                <td className={clsx(cell, "text-right font-semibold", figures.outstanding > 0 ? "text-red-600" : "text-gray-400")}>
                  {figures.outstanding > 0 ? num(figures.outstanding) : "—"}
                </td>
                <td className={cell}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                      <div className="h-full rounded-full bg-gray-700" style={{ width: `${figures.rate}%` }} />
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-600">{figures.rate} %</span>
                  </div>
                </td>
                <td className={clsx(cell, "text-right text-gray-700")}>
                  {ledger.kind === "waiting"
                    ? "—"
                    : t("admin.tontine.registre.balance.payoutsValue", { done: figures.payoutsDone, count: figures.payoutCount })}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-gray-900">
            <th scope="row" className="border-t border-gray-300 px-3 py-2.5 text-sm">{t("admin.tontine.registre.balance.total")}</th>
            <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">
              {t("admin.tontine.registre.balance.payersValue", { paid: total.paidCount, size: total.size })}
            </td>
            <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">{num(total.expected)}</td>
            <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">{num(total.received)}</td>
            <td className={clsx("border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums", total.outstanding > 0 && "text-red-600")}>
              {total.outstanding > 0 ? num(total.outstanding) : "—"}
            </td>
            <td className="whitespace-nowrap border-t border-gray-300 px-3 py-2.5 text-xs">{totalRate} %</td>
            <td className="border-t border-gray-300 px-3 py-2.5 text-right text-sm tabular-nums">
              {t("admin.tontine.registre.balance.payoutsValue", { done: total.payoutsDone, count: total.payoutCount })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
