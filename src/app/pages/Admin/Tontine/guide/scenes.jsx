// Import Dependencies
import { useState } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import { ArrowPathIcon, CheckIcon, GiftIcon, PlayIcon } from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { Avatar } from "../../components/Avatar";
import { useTontineFormat } from "../format";
import { useAutoplay, useCountUp, useStagger } from "./hooks";

// ----------------------------------------------------------------------
// Les petites démonstrations du guide. Chacune s'anime toute seule au début,
// puis se laisse manipuler : dès qu'on la touche, elle arrête de tourner et
// prévient le guide ("onInteract") pour que l'invitation cesse de clignoter.
// "voice" vaut "admin" ou "member" : seules les phrases à la 2e personne en
// dépendent.

const SOLID = "rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5";

function Caption({ children }) {
  return <p className="mt-3 text-center text-sm font-medium text-gray-700">{children}</p>;
}

function PrimaryButton({ onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </button>
  );
}

// ---------- 1. Le cycle : 36 membres, 12 tours, 3 par tour ----------
export function CycleScene({ onInteract }) {
  const { t } = useTontineFormat();
  const [tour, setTour] = useState(1);
  const [auto, setAuto] = useState(true);
  useAutoplay(() => setTour((current) => (current % 12) + 1), 1600, auto);

  const pick = (value) => {
    setAuto(false);
    setTour(value);
    onInteract();
  };
  const from = (tour - 1) * 3 + 1;

  return (
    <div>
      <div className="grid grid-cols-12 gap-1" role="group" aria-label={t("guideJourney.scenes.cycle.tours")}>
        {Array.from({ length: 12 }, (_unused, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => pick(value)}
            aria-pressed={tour === value}
            aria-label={t("guideJourney.scenes.cycle.tourN", { tour: value })}
            className={clsx(
              "rounded-md py-1.5 text-[11px] font-bold transition-all duration-300 motion-reduce:transition-none",
              tour === value ? "scale-110 bg-[#EE7115] text-white shadow" : "bg-white text-gray-500 ring-1 ring-black/10 hover:bg-gray-100",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-flow-col grid-cols-12 grid-rows-3 justify-items-center gap-y-1.5" aria-hidden="true">
        {Array.from({ length: 36 }, (_unused, i) => {
          const owner = Math.floor(i / 3) + 1;
          const state = owner === tour ? "now" : owner < tour ? "done" : "todo";
          return (
            <span
              key={i}
              className={clsx(
                "size-3.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
                state === "now" && "scale-125 bg-[#EE7115] ring-4 ring-[#EE7115]/25",
                state === "done" && "bg-[#52A2DF]/60",
                state === "todo" && "bg-gray-200",
              )}
            />
          );
        })}
      </div>

      <Caption>{t("guideJourney.scenes.cycle.caption", { tour, from, to: from + 2 })}</Caption>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {["now", "done", "todo"].map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              className={clsx(
                "size-3 rounded-full",
                key === "now" && "bg-[#EE7115]",
                key === "done" && "bg-[#52A2DF]/60",
                key === "todo" && "bg-gray-200",
              )}
            />
            {t(`guideJourney.scenes.cycle.legend.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 2. L'argent : 12 cotisations, une cagnotte de 11 ----------
function Tile({ label, value, detail, tone }) {
  return (
    <div className={clsx(SOLID, "flex items-center justify-between gap-3")}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {detail && <p className="mt-0.5 text-xs text-gray-400">{detail}</p>}
      </div>
      <p className={clsx("shrink-0 text-lg font-bold tabular-nums", tone ?? "text-gray-900")}>{value}</p>
    </div>
  );
}

// Les 12 pièces apparaissent une à une (le "key" les rejoue à chaque changement de niveau).
function Coins() {
  const shown = useStagger(12, 80);
  return (
    <div className="mt-2 grid grid-cols-12 gap-0.5" aria-hidden="true">
      {Array.from({ length: 12 }, (_unused, i) => (
        <span
          key={i}
          className={clsx(
            "flex aspect-square items-center justify-center rounded-full text-[9px] font-bold text-white transition-all duration-300 motion-reduce:transition-none",
            i === 0 ? "bg-amber-400" : "bg-[#52A2DF]",
            i < shown ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

export function MoneyScene({ onInteract }) {
  const { t, money } = useTontineFormat();
  const [levelKey, setLevelKey] = useState("starter");
  const level = levels.find((item) => item.key === levelKey) ?? levels[0];
  const pot = useCountUp(level.cagnotte);
  const fee = useCountUp(level.cotisation);
  const monthly = useCountUp(level.cotisation * 36);

  return (
    <div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2" role="group" aria-label={t("guideJourney.scenes.money.level")}>
        {levels.slice(0, 6).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setLevelKey(item.key);
              onInteract();
            }}
            aria-pressed={item.key === levelKey}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              item.key === levelKey ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/10 hover:bg-gray-100",
            )}
          >
            {t(`simulateur.levels.${item.key}.name`)}
          </button>
        ))}
      </div>

      {/* Les 12 cotisations d'un membre : la 1re = frais, les 11 autres forment la cagnotte */}
      <p className="mt-2 text-xs font-semibold text-gray-500">{t("guideJourney.scenes.money.coins")}</p>
      <Coins key={levelKey} />
      <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold">
        <span className="w-[8.33%] min-w-4 text-center text-amber-600">{t("guideJourney.scenes.money.feeTag")}</span>
        <span className="h-px flex-1 bg-[#52A2DF]/50" />
        <span className="text-[#2f86c8]">{t("guideJourney.scenes.money.potTag")}</span>
        <span className="h-px flex-1 bg-[#52A2DF]/50" />
      </div>

      <div className="mt-4 space-y-2">
        <Tile
          label={t("guideJourney.scenes.money.fee")}
          value={money(fee)}
          tone="text-amber-600"
          detail={t("guideJourney.scenes.money.feeDetail")}
        />
        <Tile
          label={t("guideJourney.scenes.money.pot")}
          value={money(pot)}
          tone="text-[#2f86c8]"
          detail={t("guideJourney.scenes.money.potDetail", { amount: money(level.cotisation) })}
        />
        <Tile
          label={t("guideJourney.scenes.money.month")}
          value={money(monthly)}
          detail={t("guideJourney.scenes.money.monthDetail", { amount: money(level.cotisation) })}
        />
      </div>
    </div>
  );
}

// ---------- 3. Personne ne valide : le paiement s'inscrit tout seul ----------
const AUTO_MEMBERS = [
  { name: "Landry Mensah", paid: true },
  { name: "Akosua Fotso", paid: true },
  { name: "Boubacar Eze", paid: false },
  { name: "Larissa Diop", paid: false },
  { name: "Marie Atangana", paid: false },
];
const AMOUNT = 5000;

export function AutoScene({ voice, onInteract }) {
  const { t, money } = useTontineFormat();
  const [paid, setPaid] = useState(() => AUTO_MEMBERS.map((member) => member.paid));
  const [flash, setFlash] = useState(null);
  const count = paid.filter(Boolean).length;
  const received = useCountUp(count * AMOUNT, 500);
  const all = count === AUTO_MEMBERS.length;

  const simulate = () => {
    onInteract();
    const next = paid.findIndex((value) => !value);
    if (next === -1) {
      setPaid(AUTO_MEMBERS.map((member) => member.paid));
      setFlash(null);
      return;
    }
    setPaid(paid.map((value, i) => value || i === next));
    setFlash(next);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{t("guideJourney.scenes.auto.received")}</p>
          <p className="text-xl font-bold tabular-nums text-gray-900">
            {money(received)} <span className="text-sm font-medium text-gray-400">/ {money(AUTO_MEMBERS.length * AMOUNT)}</span>
          </p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-green-500 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${(count / AUTO_MEMBERS.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {AUTO_MEMBERS.map((member, i) => (
          <li
            key={member.name}
            className={clsx(
              "flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 transition-all duration-500 motion-reduce:transition-none",
              flash === i && paid[i] ? "scale-[1.02] ring-2 ring-green-400" : "ring-black/5",
            )}
          >
            <Avatar name={member.name} size="size-8" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{member.name}</span>
                        <span
              className={clsx(
                "inline-flex w-20 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors duration-500",
                paid[i] ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20",
              )}
            >
              {paid[i] && <CheckIcon aria-hidden="true" className="size-3.5" />}
              {paid[i] ? t("guideJourney.scenes.auto.paid") : t("guideJourney.scenes.auto.pending")}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col items-center gap-2">
        <PrimaryButton onClick={simulate} icon={all ? ArrowPathIcon : PlayIcon}>
          {all ? t("guideJourney.scenes.auto.reset") : t("guideJourney.scenes.auto.simulate")}
        </PrimaryButton>
        <p className={clsx("text-center text-sm font-medium transition-opacity duration-500", flash !== null ? "text-green-700 opacity-100" : "text-gray-400")}>
          {all ? t("guideJourney.scenes.auto.allPaid") : t(`guideJourney.scenes.auto.caption.${voice}`)}
        </p>
      </div>
    </div>
  );
}

// ---------- 4. Le grand livre : lire les cases ----------
// "P" payé, "U" non payé, "L" retard, "A" à payer, "G" payé + cagnotte, "." pas concerné
const LEDGER_ROWS = [
  { name: "Landry M.", cells: "PPPPP" },
  { name: "Akosua F.", cells: "PPUPP" },
  { name: "Boubacar E.", cells: "PPPPL" },
  { name: "Larissa D.", cells: "PPPPA" },
  { name: "Marie A.", cells: "PPGPP" },
];
const LEDGER_STATES = ["P", "U", "L", "A", "G"];
const STATE_KEY = { P: "paid", U: "unpaid", L: "late", A: "awaiting", G: "gift" };

function LedgerCell({ code, dim }) {
  const { t } = useTontineFormat();
  let content = <span className="text-gray-900">5 000</span>;
  if (code === "U") content = <span className="font-bold text-red-600">—</span>;
  if (code === "L") content = <span className="rounded bg-red-50 px-1 py-0.5 text-[11px] font-bold text-red-600">{t("admin.tontine.registre.cell.late")}</span>;
  if (code === "A") content = <span className="text-[11px] font-semibold text-amber-600">{t("admin.tontine.registre.cell.awaiting")}</span>;
  if (code === "G")
    content = (
      <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 ring-2 ring-[#EE7115]/70">
        <GiftIcon aria-hidden="true" className="size-3 text-[#EE7115]" />
        <span className="text-gray-900">5 000</span>
      </span>
    );
  return (
    <td className={clsx("h-9 border-b border-gray-100 px-1.5 text-right text-xs tabular-nums transition-opacity duration-500", dim && "opacity-20")}>
      {content}
    </td>
  );
}

export function LedgerScene({ onInteract }) {
  const { t, monthShort } = useTontineFormat();
  const [focus, setFocus] = useState("P");
  const [auto, setAuto] = useState(true);
  useAutoplay(() => setFocus((current) => LEDGER_STATES[(LEDGER_STATES.indexOf(current) + 1) % LEDGER_STATES.length]), 2200, auto);

  const months = Array.from({ length: 5 }, (_unused, i) => dayjs().subtract(4 - i, "month"));
  const matches = (code) => (focus === "G" ? code === "G" : focus === code || (focus === "P" && code === "G"));

  return (
    <div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full min-w-[420px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500">
              <th scope="col" className="border-b border-gray-200 px-3 py-2">{t("admin.tontine.registre.book.member")}</th>
              {months.map((month, i) => (
                <th
                  key={month.format("YYYY-MM")}
                  scope="col"
                  className={clsx("border-b border-gray-200 px-1.5 py-2 text-right", i === 4 && "bg-[#52A2DF]/20 text-gray-900")}
                >
                  {monthShort(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER_ROWS.map((row) => (
              <tr key={row.name}>
                <th scope="row" className="h-9 border-b border-gray-100 px-3 text-sm font-medium text-gray-900">{row.name}</th>
                {[...row.cells].map((code, i) => (
                  <LedgerCell key={i} code={code} dim={!matches(code)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label={t("guideJourney.scenes.ledger.legend")}>
        {LEDGER_STATES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setAuto(false);
              setFocus(code);
              onInteract();
            }}
            aria-pressed={focus === code}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              focus === code ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/10 hover:bg-gray-100",
            )}
          >
            {t(`guideJourney.scenes.ledger.states.${STATE_KEY[code]}`)}
          </button>
        ))}
      </div>
      <Caption>{t(`guideJourney.scenes.ledger.explain.${STATE_KEY[focus]}`)}</Caption>
    </div>
  );
}

// ---------- 5. Le journal : reçu / versé / impayé ----------
const JOURNAL_OPS = [
  { id: 1, kind: "in", name: "Landry Mensah", day: 3, amount: 5000 },
  { id: 2, kind: "in", name: "Akosua Fotso", day: 4, amount: 5000 },
  { id: 3, kind: "out", name: "Marie Atangana", day: 9, amount: 55000 },
  { id: 4, kind: "due", name: "Larissa Diop", day: 5, amount: 5000 },
  { id: 5, kind: "in", name: "Boubacar Eze", day: 5, amount: 5000 },
  { id: 6, kind: "out", name: "Patrick Essono", day: 12, amount: 55000 },
];
const JOURNAL_TYPES = ["all", "in", "out", "due"];

export function JournalScene({ onInteract }) {
  const { t, locale } = useTontineFormat();
  const [type, setType] = useState("all");
  const month = dayjs();
  const shown = JOURNAL_OPS.filter((op) => type === "all" || op.kind === type);
  const sum = (kind) => shown.filter((op) => op.kind === kind).reduce((total, op) => total + op.amount, 0);
  const totalIn = useCountUp(sum("in"), 500);
  const totalOut = useCountUp(sum("out"), 500);
  const totalDue = useCountUp(sum("due"), 500);
  const num = (value) => value.toLocaleString(locale);
  const col = "w-14 shrink-0 text-right text-xs tabular-nums";

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label={t("admin.tontine.registre.journal.type")}>
        {JOURNAL_TYPES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setType(key);
              onInteract();
            }}
            aria-pressed={type === key}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              type === key ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/10 hover:bg-gray-100",
            )}
          >
            {t(`admin.tontine.registre.journal.types.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
          <span className="min-w-0 flex-1">{t("admin.tontine.registre.journal.label")}</span>
          <span className={col}>{t("admin.tontine.registre.journal.in")}</span>
          <span className={col}>{t("admin.tontine.registre.journal.out")}</span>
          <span className={col}>{t("admin.tontine.registre.journal.due")}</span>
        </div>
        {JOURNAL_OPS.map((op) => {
          const visible = type === "all" || op.kind === type;
          return (
            <div
              key={op.id}
              className={clsx(
                "overflow-hidden transition-all duration-500 motion-reduce:transition-none",
                visible ? "max-h-14 opacity-100" : "max-h-0 opacity-0",
              )}
              aria-hidden={!visible}
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{op.name}</p>
                  <p className="truncate text-[11px] text-gray-400">
                    {month.date(op.day).format("DD/MM")} · {t(`guideJourney.scenes.journal.labels.${op.kind}`)}
                  </p>
                </div>
                <span className={clsx(col, "text-gray-900")}>{op.kind === "in" ? num(op.amount) : "—"}</span>
                <span className={clsx(col, "text-gray-900")}>{op.kind === "out" ? num(op.amount) : "—"}</span>
                <span className={clsx(col, op.kind === "due" ? "font-semibold text-red-600" : "text-gray-900")}>{op.kind === "due" ? num(op.amount) : "—"}</span>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-900">
          <span className="min-w-0 flex-1">{t("guideJourney.scenes.journal.total")}</span>
          <span className={col}>{num(totalIn)}</span>
          <span className={col}>{num(totalOut)}</span>
          <span className={clsx(col, totalDue > 0 && "text-red-600")}>{num(totalDue)}</span>
        </div>
      </div>
      <Caption>{t("guideJourney.scenes.journal.caption")}</Caption>
    </div>
  );
}

// ---------- 6. La fiche de compte : le solde évolue ligne après ligne ----------
const STATEMENT_LINES = [
  { kind: "in", amount: 5000 },
  { kind: "in", amount: 5000 },
  { kind: "due", amount: 5000 },
  { kind: "in", amount: 5000 },
  { kind: "out", amount: 55000 },
];

export function StatementScene({ onInteract }) {
  const { t, locale } = useTontineFormat();
  const [shown, setShown] = useState(1);
  const [auto, setAuto] = useState(true);
  const end = shown >= STATEMENT_LINES.length;
  useAutoplay(() => setShown((current) => Math.min(STATEMENT_LINES.length, current + 1)), 1500, auto && !end);

  const balances = [];
  STATEMENT_LINES.reduce((balance, line) => {
    const next = line.kind === "in" ? balance - line.amount : line.kind === "out" ? balance + line.amount : balance;
    balances.push(next);
    return next;
  }, 0);
  const balance = balances[shown - 1];
  const animated = useCountUp(balance, 600);
  const signed = (value) => `${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toLocaleString(locale)}`;
  const max = Math.max(...balances.map(Math.abs));

  const next = () => {
    setAuto(false);
    onInteract();
    setShown(end ? 1 : shown + 1);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{t("guideJourney.scenes.statement.balance")}</p>
          <p className={clsx("text-2xl font-bold tabular-nums transition-colors duration-500", animated > 0 ? "text-green-700" : "text-gray-900")}>
            {signed(animated)} <span className="text-sm font-medium text-gray-400">F</span>
          </p>
        </div>
        {/* Le solde, mois après mois : sous la ligne tant qu'il n'a pas reçu, au-dessus ensuite */}
        <div className="relative h-16 w-32" aria-hidden="true">
          <span className="absolute inset-x-0 top-1/2 h-px bg-gray-300" />
          <div className="absolute inset-0 flex items-center justify-between gap-1">
            {balances.map((value, i) => {
              const height = `${Math.max(6, (Math.abs(value) / max) * 50)}%`;
              return (
                <span key={i} className="relative h-full flex-1">
                  <span
                    style={{ height: i < shown ? height : "0%" }}
                    className={clsx(
                      "absolute inset-x-0 rounded-sm transition-all duration-700 motion-reduce:transition-none",
                      value < 0 ? "top-1/2 bg-gray-400" : "bottom-1/2 bg-green-500",
                    )}
                  />
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {STATEMENT_LINES.map((line, i) => (
          <div
            key={i}
            className={clsx(
              "flex items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm transition-all duration-500 motion-reduce:transition-none",
              i < shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <span className="min-w-0 flex-1 truncate text-gray-800">{t(`guideJourney.scenes.statement.lines.${line.kind}`, { n: i + 1 })}</span>
            <span className={clsx("shrink-0 text-right tabular-nums", line.kind === "due" ? "font-semibold text-red-600" : "text-gray-900")}>
              {line.kind === "due" ? t("admin.tontine.registre.statement.unpaid") : signed(line.kind === "in" ? -line.amount : line.amount)}
              {line.kind !== "due" && (
                <span className="block text-[11px] font-normal text-gray-400">
                  {t("guideJourney.scenes.statement.balance")} {signed(balances[i])}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <PrimaryButton onClick={next} icon={end ? ArrowPathIcon : PlayIcon}>
          {end ? t("guideJourney.scenes.statement.replay") : t("guideJourney.scenes.statement.next")}
        </PrimaryButton>
        <p className="text-center text-sm font-medium text-gray-700">
          {t(end ? "guideJourney.scenes.statement.captionEnd" : "guideJourney.scenes.statement.caption")}
        </p>
      </div>
    </div>
  );
}
