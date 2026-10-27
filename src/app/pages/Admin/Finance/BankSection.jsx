// Import Dependencies
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { formatMoney } from "app/pages/Simulateur/data";
import { ACCOUNTS, RESERVE_RATE, accountSummary } from "./bankData";
import { ImportDialog } from "./ImportDialog";
import { clearImportedRows, useBankData } from "./bankStore";

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

// Classes écrites en toutes lettres (Tailwind ne voit pas les gabarits).
const ACCOUNT_STYLES = {
  A: { badge: "bg-[#52A2DF] text-white", ring: "ring-[#52A2DF]", tint: "bg-[#52A2DF]/[0.08]" },
  B: { badge: "bg-[#EE7115] text-white", ring: "ring-[#EE7115]", tint: "bg-[#EE7115]/[0.08]" },
  C: { badge: "bg-[#16A34A] text-white", ring: "ring-[#16A34A]", tint: "bg-[#16A34A]/[0.08]" },
};

const SELECT =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

function AccountCard({ account, summary, selected, onSelect, locale }) {
  const { t } = useTranslation();
  const style = ACCOUNT_STYLES[account.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "flex h-full flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 transition-shadow hover:shadow-md",
        selected ? clsx("ring-2", style.ring) : "ring-black/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={clsx("flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-bold", style.badge)}>
            {account.id}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{t(`admin.finance.bank.accounts.${account.id}.name`)}</p>
            <p className="text-xs text-gray-500">{t(`admin.finance.bank.accounts.${account.id}.holds`)}</p>
          </div>
        </div>
        {account.locked ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-white">
            <LockClosedIcon aria-hidden="true" className="size-3" />
            {t("admin.finance.bank.untouchable")}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
            {t("admin.finance.bank.operational")}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-bold tabular-nums text-gray-900">{formatMoney(summary.balance, locale)}</p>
      <p className="text-xs text-gray-500">{t("admin.finance.bank.balance")}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-green-50 px-2.5 py-1.5">
          <dt className="text-green-700">{t("admin.finance.bank.monthIn")}</dt>
          <dd className="font-bold tabular-nums text-green-800">{formatMoney(summary.monthIn, locale)}</dd>
        </div>
        <div className="rounded-lg bg-red-50 px-2.5 py-1.5">
          <dt className="text-red-700">{t("admin.finance.bank.monthOut")}</dt>
          <dd className="font-bold tabular-nums text-red-800">{formatMoney(summary.monthOut, locale)}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
        {account.locked ? (
          <>
            <PencilSquareIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
            {t("admin.finance.bank.doubleSignature")}
          </>
        ) : (
          t("admin.finance.bank.accounts.A.access")
        )}
      </p>
    </button>
  );
}

// Un mouvement bancaire : le libellé vient des traductions (admin.finance.bank.tx.<type>).
function useDescribe() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const monthName = (iso) => {
    const text = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  return (row) =>
    row.label ??
    t(`admin.finance.bank.tx.${row.kind}`, {
      month: monthName(row.params.month),
      level: row.params.level ? t(`simulateur.levels.${row.params.level}.name`) : "",
      tour: row.params.tour,
      rate: Math.round(RESERVE_RATE * 100),
    });
}

// Qui a initié / qui reçoit : une personne, un compte DBC, ou un ensemble (membres, équipe, banque…).
function usePartyText() {
  const { t } = useTranslation();
  return (party) => {
    if (!party) return "";
    if (party.name) return party.name;
    if (party.account) return t(`admin.finance.bank.accounts.${party.account}.name`);
    return t(`admin.finance.bank.party.${party.key}`, {
      level: party.params?.level ? t(`simulateur.levels.${party.params.level}.name`) : "",
    });
  };
}

function signersText(row, t) {
  return row.signers
    .map((signer) => (signer.role ? `${signer.name} (${t(`admin.finance.bank.history.role.${signer.role}`)})` : signer.name))
    .join(" · ");
}

export function BankSection() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const describe = useDescribe();
  const partyText = usePartyText();
  const { transactions, openings, imported, importedCount, importedRows } = useBankData();
  const [importOpen, setImportOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [account, setAccount] = useState("all");
  const [direction, setDirection] = useState("all");
  const [month, setMonth] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const summaries = useMemo(
    () => Object.fromEntries(ACCOUNTS.map((item) => [item.id, accountSummary(item.id, transactions, openings)])),
    [transactions, openings],
  );
  const months = useMemo(
    () => [...new Set(transactions.map((row) => row.date.slice(0, 7)))].sort().reverse(),
    [transactions],
  );

  const wanted = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      transactions
        .filter((row) => account === "all" || row.account === account)
        .filter((row) => direction === "all" || (direction === "in" ? row.amount > 0 : row.amount < 0))
        .filter((row) => month === "all" || row.date.startsWith(month))
        .filter(
          (row) =>
            !wanted ||
            `${describe(row)} ${row.reference} ${partyText(row.initiator)} ${partyText(row.recipient)}`.toLowerCase().includes(wanted),
        )
        .slice()
        .reverse(),
    // describe dépend de la langue seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, account, direction, month, wanted, i18n.language],
  );

  const totalIn = rows.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
  const totalOut = -rows.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0);
  const monthLabel = (value) => {
    const text = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const pick = (id) => {
    setAccount((current) => (current === id ? "all" : id));
    setShown(PAGE_SIZE);
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <BuildingLibraryIcon aria-hidden="true" className="size-5 text-[#EE7115]" />
          {t("admin.finance.bank.title")}
        </h2>
        <p className="mt-2 max-w-4xl text-sm text-gray-600">{t("admin.finance.bank.intro")}</p>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
          <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#EE7115]" />
          <span>{t("admin.finance.bank.protection")}</span>
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ACCOUNTS.map((item) => (
          <AccountCard
            key={item.id}
            account={item}
            summary={summaries[item.id]}
            selected={account === item.id}
            onSelect={() => pick(item.id)}
            locale={locale}
          />
        ))}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t("admin.finance.bank.history.title")}</h2>
            <p className="mt-1 text-xs text-gray-500">{t("admin.finance.bank.history.hint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#EE7115] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d9650f]"
          >
            <ArrowUpTrayIcon aria-hidden="true" className="size-4" />
            {t("admin.finance.bank.import.button")}
          </button>
        </div>

        {imported && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
            <span>{t("admin.finance.bank.import.active", { count: importedCount })}</span>
            {confirmRemove ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold">{t("admin.finance.bank.import.removeConfirm")}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearImportedRows();
                    setConfirmRemove(false);
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  {t("admin.finance.bank.import.removeYes")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-300 hover:bg-white"
                >
                  {t("admin.finance.bank.import.cancel")}
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                <TrashIcon aria-hidden="true" className="size-3.5" />
                {t("admin.finance.bank.import.remove")}
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">{t("admin.finance.bank.history.search")}</span>
            <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShown(PAGE_SIZE);
              }}
              placeholder={t("admin.finance.bank.history.search")}
              className={clsx(SELECT, "w-full pl-9")}
            />
          </label>
          <select
            aria-label={t("admin.finance.bank.history.account")}
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              setShown(PAGE_SIZE);
            }}
            className={SELECT}
          >
            <option value="all">{t("admin.finance.bank.history.allAccounts")}</option>
            {ACCOUNTS.map((item) => (
              <option key={item.id} value={item.id}>
                {t("admin.finance.bank.history.accountOption", { id: item.id, name: t(`admin.finance.bank.accounts.${item.id}.name`) })}
              </option>
            ))}
          </select>
          <select
            aria-label={t("admin.finance.bank.history.direction")}
            value={direction}
            onChange={(event) => {
              setDirection(event.target.value);
              setShown(PAGE_SIZE);
            }}
            className={SELECT}
          >
            <option value="all">{t("admin.finance.bank.history.allMovements")}</option>
            <option value="in">{t("admin.finance.bank.history.inOnly")}</option>
            <option value="out">{t("admin.finance.bank.history.outOnly")}</option>
          </select>
          <select
            aria-label={t("admin.finance.bank.history.month")}
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setShown(PAGE_SIZE);
            }}
            className={SELECT}
          >
            <option value="all">{t("admin.finance.bank.history.allMonths")}</option>
            {months.map((value) => (
              <option key={value} value={value}>
                {monthLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-green-50 px-4 py-3">
            <dt className="text-xs font-semibold text-green-700">{t("admin.finance.bank.history.totalIn")}</dt>
            <dd className="text-lg font-bold tabular-nums text-green-800">{formatMoney(totalIn, locale)}</dd>
          </div>
          <div className="rounded-xl bg-red-50 px-4 py-3">
            <dt className="text-xs font-semibold text-red-700">{t("admin.finance.bank.history.totalOut")}</dt>
            <dd className="text-lg font-bold tabular-nums text-red-800">{formatMoney(totalOut, locale)}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <dt className="text-xs font-semibold text-gray-600">{t("admin.finance.bank.history.net")}</dt>
            <dd className="text-lg font-bold tabular-nums text-gray-900">
              {totalIn - totalOut < 0 ? "−" : ""}
              {formatMoney(Math.abs(totalIn - totalOut), locale)}
            </dd>
          </div>
        </dl>

        {rows.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            {t("admin.finance.bank.history.empty")}
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">{t("admin.finance.bank.history.col.date")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.finance.bank.history.col.account")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.finance.bank.history.col.label")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.finance.bank.history.col.initiator")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.finance.bank.history.col.recipient")}</th>
                  <th scope="col" className="px-3 py-3 text-right">{t("admin.finance.bank.history.col.amount")}</th>
                  <th scope="col" className="px-3 py-3 text-right">{t("admin.finance.bank.history.col.balance")}</th>
                  <th scope="col" className="px-4 py-3">{t("admin.finance.bank.history.col.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, shown).map((row) => {
                  const incoming = row.amount > 0;
                  const Arrow = incoming ? ArrowDownLeftIcon : ArrowUpRightIcon;
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{dayjs(row.date).format("DD/MM/YYYY")}</td>
                      <td className="px-3 py-3">
                        <span className={clsx("inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold", ACCOUNT_STYLES[row.account].badge)}>
                          {row.account}
                        </span>
                      </td>
                      <td className="min-w-[17rem] px-3 py-3">
                        <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                          <Arrow aria-hidden="true" className={clsx("size-4 shrink-0", incoming ? "text-green-600" : "text-red-600")} />
                          {describe(row)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {row.reference}
                          {row.signed && (
                            <span className="ml-2 inline-flex items-center gap-1 font-semibold text-gray-600">
                              <PencilSquareIcon aria-hidden="true" className="size-3" />
                              {t("admin.finance.bank.history.signed")}
                            </span>
                          )}
                          {row.unsigned && (
                            <span className="ml-2 inline-flex items-center gap-1 font-semibold text-red-600">
                              <ExclamationTriangleIcon aria-hidden="true" className="size-3" />
                              {t("admin.finance.bank.history.unsigned")}
                            </span>
                          )}
                        </p>
                        {row.signed && (
                          <p className="mt-0.5 text-xs text-gray-500">{t("admin.finance.bank.history.signedBy", { names: signersText(row, t) })}</p>
                        )}
                      </td>
                      <td className="min-w-[9rem] px-3 py-3 text-gray-800">
                        {row.initiator ? partyText(row.initiator) : <span className="text-gray-400">{t("admin.finance.bank.party.unknown")}</span>}
                      </td>
                      <td className="min-w-[9rem] px-3 py-3 text-gray-800">
                        {row.recipient ? partyText(row.recipient) : <span className="text-gray-400">{t("admin.finance.bank.party.unknown")}</span>}
                      </td>
                      <td className={clsx("whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums", incoming ? "text-green-700" : "text-red-700")}>
                        {incoming ? "+" : "−"}
                        {formatMoney(Math.abs(row.amount), locale)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-600">{formatMoney(row.balanceAfter, locale)}</td>
                      <td className="px-4 py-3">
                        {row.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <ClockIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.finance.bank.history.pending")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                            <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.finance.bank.history.confirmed")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > shown && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShown((value) => value + PAGE_SIZE)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#EE7115] ring-1 ring-[#EE7115]/30 transition-colors hover:bg-[#EE7115]/[0.06]"
            >
              {t("admin.finance.bank.history.more", { count: Math.min(PAGE_SIZE, rows.length - shown) })}
            </button>
          </div>
        )}
        {!imported && <p className="mt-4 text-xs text-gray-400">{t("admin.finance.bank.history.demo")}</p>}
      </section>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} importedRows={importedRows} />
    </div>
  );
}
