// Import Dependencies
import clsx from "clsx";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "../components/Avatar";
import { LevelBadge } from "./LevelBadge";
import { memberStatement } from "./registreData";
import { operationLabel } from "./registreUtils";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

function Tile({ label, value, detail, tone = "text-gray-900" }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 px-3.5 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={clsx("mt-0.5 break-words text-base font-bold tabular-nums leading-tight", tone)}>{value}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-400">{detail}</p>}
    </div>
  );
}

// La FICHE DE COMPTE d'un membre dans un groupe : ce qu'il a cotisé, la
// cagnotte reçue, ce qui lui reste à payer et son prochain passage, puis le
// relevé ligne par ligne avec le solde cumulé (négatif tant que la cagnotte
// n'est pas reçue).
export function MemberStatementModal({ ledger, row, operations, monthName, onClose }) {
  const { t, money, locale, month } = useTontineFormat();
  if (!ledger || !row) return null;

  const statement = memberStatement(ledger, row, operations);
  const signed = (value) => `${value < 0 ? "−" : "+"}${Math.abs(value).toLocaleString(locale)}`;

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={row.name} size="size-12" />
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-bold text-gray-900">{row.name}</DialogTitle>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                  <LevelBadge levelKey={ledger.levelKey} />
                  <span>{ledger.kind === "waiting" ? t("admin.tontine.registre.noGroup") : t("admin.tontine.group", { letter: ledger.letter })}</span>
                  {row.city && <span aria-hidden="true">·</span>}
                  {row.city && <span>{row.city}</span>}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.tontine.registre.statement.close")}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label={t("admin.tontine.registre.statement.contributed")}
              value={money(statement.contributed)}
              detail={t("admin.tontine.registre.statement.months", { count: row.paidCount })}
            />
            <Tile
              label={t("admin.tontine.registre.statement.received")}
              value={statement.received > 0 ? money(statement.received) : "—"}
              tone={statement.received > 0 ? "text-gray-900" : "text-gray-400"}
            />
            <Tile
              label={t("admin.tontine.registre.statement.owed")}
              value={statement.owed > 0 ? money(statement.owed) : "—"}
              tone={statement.owed > 0 ? "text-red-600" : "text-gray-400"}
              detail={statement.owed > 0 ? t("admin.tontine.registre.statement.owedMonths", { count: row.owedCount }) : t("admin.tontine.registre.statement.upToDate")}
            />
            <Tile
              label={t("admin.tontine.registre.statement.nextTurn")}
              value={
                ledger.kind === "waiting"
                  ? "—"
                  : statement.nextTurn
                    ? month(statement.nextTurn.month)
                    : t("admin.tontine.registre.statement.done")
              }
              detail={
                ledger.kind === "waiting"
                  ? t("admin.tontine.registre.statement.noOrder")
                  : statement.nextTurn
                    ? t("admin.tontine.registre.statement.tour", { tour: statement.nextTurn.tour })
                    : undefined
              }
            />
          </div>

          <h3 className="mt-6 text-sm font-bold text-gray-900">{t("admin.tontine.registre.statement.title")}</h3>
          {statement.lines.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-black/10 p-6 text-center text-sm text-gray-500">
              {t("admin.tontine.registre.statement.empty")}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500">
                    <th scope="col" className="border-b border-gray-200 px-2 py-2 sm:px-3">{t("admin.tontine.registre.journal.date")}</th>
                    <th scope="col" className="border-b border-gray-200 px-2 py-2 sm:px-3">{t("admin.tontine.registre.journal.label")}</th>
                    <th scope="col" className="border-b border-gray-200 px-2 py-2 sm:px-3 text-right">{t("admin.tontine.registre.statement.amount")}</th>
                    <th scope="col" className="hidden border-b border-gray-200 px-2 py-2 text-right sm:table-cell sm:px-3">{t("admin.tontine.registre.statement.balance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.lines.map((line, index) => (
                    <tr key={line.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                      <td className="whitespace-nowrap border-b border-gray-100 px-2 py-2 tabular-nums text-gray-600 sm:px-3">
                        <span className="sm:hidden">{line.date.format("DD/MM/YY")}</span>
                        <span className="hidden sm:inline">{line.date.format("DD/MM/YYYY")}</span>
                      </td>
                      <td className="border-b border-gray-100 px-2 py-2 text-gray-800 sm:px-3">{operationLabel(t, line, monthName)}</td>
                      <td
                        className={clsx(
                          "whitespace-nowrap border-b border-gray-100 px-2 py-2 text-right tabular-nums sm:px-3",
                          line.kind === "due" ? "font-semibold text-red-600" : "text-gray-900",
                        )}
                      >
                        {line.kind === "due"
                          ? t("admin.tontine.registre.statement.unpaid")
                          : signed(line.kind === "in" ? -line.amount : line.amount)}
                        {line.balance !== null && (
                          <span className="block text-[11px] font-normal text-gray-400 sm:hidden">
                            {t("admin.tontine.registre.statement.balance")} {signed(line.balance)}
                          </span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap border-b border-gray-100 px-2 py-2 text-right tabular-nums text-gray-600 sm:table-cell sm:px-3">
                        {line.balance === null ? "" : signed(line.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-gray-900">
                    <th scope="row" colSpan={2} className="px-2 py-2.5 text-left sm:px-3">{t("admin.tontine.registre.statement.balanceNow")}</th>
                    <td colSpan={2} className="px-2 py-2.5 text-right tabular-nums sm:px-3">{signed(statement.balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">{t("admin.tontine.registre.statement.note")}</p>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
