// Import Dependencies
import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import { GiftIcon } from "@heroicons/react/24/solid";

// Local Imports
import { LevelBadge } from "./LevelBadge";
import { monthFigures } from "./registreData";
import { useTontineFormat } from "./format";
import { shortName } from "./mockData";

// ----------------------------------------------------------------------

const ROW_H = 36; // hauteur d'une ligne de total collée en bas (px)

function Figure({ label, value, detail, tone = "text-gray-900" }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={clsx("mt-0.5 truncate text-lg font-bold tabular-nums", tone)}>{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs text-gray-400">{detail}</p>}
    </div>
  );
}

// L'en-tête d'un livre : le groupe, et ses quatre chiffres pour le mois choisi
// (attendu, reçu, reste à recouvrer, cagnottes versées) avec les bénéficiaires.
export function LedgerSummary({ ledger, monthValue }) {
  const { t, money, month, day } = useTontineFormat();
  const figures = monthFigures(ledger, monthValue);
  const isGroup = ledger.kind === "group";

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <LevelBadge levelKey={ledger.levelKey} />
          <h3 className="text-sm font-bold text-gray-900">{isGroup ? t("admin.tontine.group", { letter: ledger.letter }) : t("admin.tontine.registre.noGroup")}</h3>
        </div>
        <p className="text-xs text-gray-500">
          {isGroup
            ? t("admin.tontine.registre.book.subtitle", {
                tour: ledger.groupStatus === "complete" ? ledger.totalTours : ledger.tour,
                total: ledger.totalTours,
                amount: money(ledger.cotisation),
                size: ledger.rows.length,
              })
            : t("admin.tontine.registre.book.subtitleWaiting", {
                amount: money(ledger.cotisation),
                size: ledger.rows.length,
              })}
        </p>
      </div>

      {figures ? (
        <>
          <div className={clsx("grid grid-cols-2 divide-gray-100", isGroup ? "sm:grid-cols-4 sm:divide-x" : "sm:grid-cols-3 sm:divide-x")}>
            <Figure
              label={t("admin.tontine.registre.book.expected")}
              value={money(figures.expected)}
              detail={t("admin.tontine.registre.book.expectedDetail", { size: figures.size })}
            />
            <Figure
              label={t("admin.tontine.registre.book.received")}
              value={money(figures.received)}
              detail={t("admin.tontine.registre.book.receivedDetail", { paid: figures.paidCount, rate: figures.rate })}
            />
            <Figure
              label={t("admin.tontine.registre.book.outstanding")}
              value={figures.outstanding > 0 ? money(figures.outstanding) : "—"}
              tone={figures.outstanding > 0 ? "text-red-600" : "text-gray-400"}
              detail={t("admin.tontine.registre.book.outstandingDetail", { count: figures.unpaidCount })}
            />
            {isGroup && (
              <Figure
                label={t("admin.tontine.registre.book.payouts")}
                value={money(figures.payoutPaid)}
                detail={t("admin.tontine.registre.book.payoutsDetail", {
                  done: figures.payoutsDone,
                  count: figures.payoutCount,
                  due: money(figures.payoutDue),
                })}
              />
            )}
          </div>

          {isGroup && figures.column.beneficiaries.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold text-gray-500">
                {t("admin.tontine.registre.book.beneficiaries", { month: month(figures.column.month) })}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {figures.column.beneficiaries.map((beneficiary) => (
                  <li
                    key={beneficiary.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#EE7115]/30 bg-[#EE7115]/[0.06] px-2.5 py-1 text-xs"
                  >
                    <GiftIcon aria-hidden="true" className="size-3.5 text-[#EE7115]" />
                    <span className="font-semibold text-gray-900">{shortName(beneficiary.name)}</span>
                    <span className="text-gray-500">
                      {beneficiary.paidOut
                        ? beneficiary.payoutDate
                          ? t("admin.tontine.registre.book.paidOn", { date: day(dayjs(beneficiary.payoutDate)) })
                          : t("admin.tontine.registre.book.paid")
                        : t("admin.tontine.registre.book.toPay")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="px-4 py-4 text-sm text-gray-500">{t("admin.tontine.registre.book.noCollection")}</p>
      )}
    </div>
  );
}

// Le GRAND LIVRE d'un groupe : une ligne par membre, une colonne par mois, le
// montant payé dans chaque case. En bas, ce qui était attendu, ce qui est
// rentré et ce qui reste à recouvrer, mois par mois. Le mois choisi est
// surligné ; la case d'un bénéficiaire porte un cadeau. Le nom d'un membre
// ouvre sa fiche de compte.
export function LedgerBook({ ledger, monthValue, matches, onOpenMember }) {
  const { t, locale, monthShort, month } = useTontineFormat();
  const scrollRef = useRef(null);
  const num = (value) => value.toLocaleString(locale);
  const isGroup = ledger.kind === "group";

  // Recentre le tableau sur le mois choisi quand il change (ou qu'on change de groupe).
  useEffect(() => {
    const box = scrollRef.current;
    const head = box?.querySelector(`th[data-month="${monthValue}"]`);
    if (!box || !head) return;
    // La colonne des noms reste collée à gauche : on centre dans l'espace restant.
    const first = box.querySelector("thead th")?.offsetWidth ?? 0;
    const target = head.offsetLeft - first - (box.clientWidth - first) / 2 + head.offsetWidth / 2;
    box.scrollTo({ left: Math.max(0, target) });
  }, [monthValue, ledger.key]);

  const rows = matches ? ledger.rows.filter(matches) : ledger.rows;

  const footers = [
    {
      key: "expected",
      label: t("admin.tontine.registre.book.rows.expected"),
      value: (column) => num(column.expectedCount * ledger.cotisation),
      total: num(ledger.totals.paid + ledger.totals.owed),
    },
    {
      key: "received",
      label: t("admin.tontine.registre.book.rows.received"),
      value: (column) => num(column.paidCount * ledger.cotisation),
      total: num(ledger.totals.paid),
    },
    {
      key: "outstanding",
      label: t("admin.tontine.registre.book.rows.outstanding"),
      value: (column) => (column.unpaidCount > 0 ? num(column.unpaidCount * ledger.cotisation) : "—"),
      total: ledger.totals.owed > 0 ? num(ledger.totals.owed) : "—",
      tone: (column) => (column && column.unpaidCount > 0) || (!column && ledger.totals.owed > 0) ? "text-red-600" : "text-gray-400",
    },
    ...(isGroup
      ? [
          {
            key: "payouts",
            label: t("admin.tontine.registre.book.rows.payouts"),
            value: (column) => `${column.payoutsDone}/${column.beneficiaries.length}`,
            total: null,
          },
        ]
      : []),
  ];

  const head = "sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-500";
  const stickyName = "sticky left-0 z-10 bg-inherit";

  const renderCell = (row, column) => {
    const state = row.cells[column.index];
    const gift = row.receives.includes(column.index);
    let content = null;
    let title = null;
    if (state === "paid") {
      content = <span className="text-gray-900">{num(ledger.cotisation)}</span>;
      title = t("admin.tontine.registre.cell.paid");
    } else if (state === "unpaid") {
      content = <span className="font-bold text-red-600">—</span>;
      title = t("admin.tontine.registre.cell.unpaid");
    } else if (state === "late") {
      content = <span className="rounded bg-red-50 px-1 py-0.5 text-[11px] font-bold text-red-600">{t("admin.tontine.registre.cell.late")}</span>;
      title = t("admin.tontine.registre.cell.lateTitle");
    } else if (state === "awaiting") {
      content = <span className="text-[11px] font-semibold text-amber-600">{t("admin.tontine.registre.cell.awaiting")}</span>;
      title = t("admin.tontine.registre.cell.awaitingTitle");
    } else {
      content = <span className="text-gray-300">·</span>;
    }
    if (gift) {
      content = (
        <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 ring-2 ring-[#EE7115]/70">
          <GiftIcon aria-hidden="true" className="size-3 text-[#EE7115]" />
          {content}
        </span>
      );
      title = [title, t("admin.tontine.registre.cell.receives")].filter(Boolean).join(" · ");
    }
    return (
      <td
        key={column.index}
        title={title ?? undefined}
        className={clsx(
          "h-9 border-b border-gray-100 px-2 text-right text-xs tabular-nums",
          column.monthValue === monthValue && "bg-[#52A2DF]/10",
        )}
      >
        {content}
      </td>
    );
  };

  return (
    <div>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={t("admin.tontine.registre.book.region")}
        className="max-h-[min(72vh,46rem)] overflow-auto rounded-xl border border-gray-200 bg-white focus-visible:outline-2 focus-visible:outline-[#52A2DF]"
      >
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th scope="col" className={clsx(head, "left-0 z-30 min-w-36 px-3 sm:min-w-44")}>
                {t("admin.tontine.registre.book.member")}
              </th>
              {ledger.columns.map((column) => (
                <th
                  key={column.index}
                  scope="col"
                  data-month={column.monthValue}
                  title={month(column.month)}
                  className={clsx(
                    head,
                    "min-w-[4.5rem] text-right",
                    column.monthValue === monthValue && "bg-[#52A2DF]/20 text-gray-900",
                    column.status === "upcoming" && "text-gray-400",
                  )}
                >
                  <span className="block whitespace-nowrap">
                    {monthShort(column.month)} {column.month.format("YY")}
                  </span>
                  {column.tour && (
                    <span className="block text-[10px] font-medium text-gray-400">
                      {t("admin.tontine.registre.book.tourShort", { tour: column.tour })}
                    </span>
                  )}
                </th>
              ))}
              <th scope="col" className={clsx(head, "min-w-24 border-l border-gray-200 text-right")}>
                {t("admin.tontine.registre.book.totalPaid")}
              </th>
              <th scope="col" className={clsx(head, "min-w-24 text-right")}>{t("admin.tontine.registre.book.owed")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={ledger.columns.length + 3} className="px-3 py-8 text-center text-sm text-gray-500">
                  {t("admin.tontine.registre.book.noMember")}
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <th
                  scope="row"
                  className={clsx(stickyName, "h-9 max-w-36 border-b border-gray-100 px-3 text-left text-sm font-medium sm:max-w-52")}
                >
                  <button
                    type="button"
                    onClick={() => onOpenMember(row)}
                    className="flex w-full items-center gap-2 text-left text-gray-900 hover:text-[#2f86c8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52A2DF]"
                  >
                    <span className="hidden w-5 shrink-0 text-right text-[11px] font-normal tabular-nums text-gray-400 sm:inline">{row.position}</span>
                    <span className="truncate">{row.name}</span>
                  </button>
                </th>
                {ledger.columns.map((column) => renderCell(row, column))}
                <td className="h-9 border-b border-l border-gray-100 px-2 text-right text-xs font-semibold tabular-nums text-gray-900">
                  {num(row.totalPaid)}
                </td>
                <td
                  className={clsx(
                    "h-9 border-b border-gray-100 px-2 text-right text-xs font-semibold tabular-nums",
                    row.owed > 0 ? "text-red-600" : "text-gray-300",
                  )}
                >
                  {row.owed > 0 ? num(row.owed) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {footers.map((footer, i) => {
              const bottom = (footers.length - 1 - i) * ROW_H;
              const base = "sticky z-10 h-9 whitespace-nowrap bg-gray-100 px-2 text-right text-xs font-semibold tabular-nums text-gray-800";
              const border = i === 0 ? "border-t border-gray-300" : "";
              return (
                <tr key={footer.key}>
                  <th
                    scope="row"
                    style={{ bottom }}
                    className={clsx(base, border, "left-0 z-20 px-2 !text-left text-xs sm:px-3")}
                  >
                    {footer.label}
                  </th>
                  {ledger.columns.map((column) => (
                    <td
                      key={column.index}
                      style={{ bottom }}
                      className={clsx(
                        base,
                        border,
                        column.monthValue === monthValue && "!bg-sky-100",
                        footer.tone?.(column),
                      )}
                    >
                      {column.status === "upcoming" ? "" : footer.value(column)}
                    </td>
                  ))}
                  <td style={{ bottom }} className={clsx(base, border, "border-l border-gray-200", footer.tone?.(null))}>
                    {footer.total ?? ""}
                  </td>
                  <td style={{ bottom }} className={clsx(base, border)} />
                </tr>
              );
            })}
          </tfoot>
        </table>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="tabular-nums text-gray-900">{num(ledger.cotisation)}</span>
          {t("admin.tontine.registre.legend.paid")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-bold text-red-600">—</span>
          {t("admin.tontine.registre.legend.unpaid")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded bg-red-50 px-1 py-0.5 text-[11px] font-bold text-red-600">{t("admin.tontine.registre.cell.late")}</span>
          {t("admin.tontine.registre.legend.late")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-amber-600">{t("admin.tontine.registre.cell.awaiting")}</span>
          {t("admin.tontine.registre.legend.awaiting")}
        </span>
        {isGroup && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md px-1 py-0.5 ring-2 ring-[#EE7115]/70">
              <GiftIcon aria-hidden="true" className="size-3 text-[#EE7115]" />
            </span>
            {t("admin.tontine.registre.legend.receives")}
          </span>
        )}
        <span className="text-gray-400">{t("admin.tontine.registre.legend.unit")}</span>
      </p>
    </div>
  );
}
