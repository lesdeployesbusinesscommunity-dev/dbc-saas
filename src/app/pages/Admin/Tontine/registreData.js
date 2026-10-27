// Import Dependencies
import { useMemo } from "react";
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { getContributionDay } from "app/pages/Admin/Parametres/platformSettings";
import { useMembersStore } from "../Membres/membersStore";
import { buildCotisationSections } from "./cotisationsData";
import { getGroups, getWaitingByLevel } from "./mockData";
import { useTontineLedger } from "./tontineLedger";

// ----------------------------------------------------------------------
// Le REGISTRE de la tontine : un "cahier de comptes" pour l'administration.
// Pour chaque groupe (et pour les membres sans groupe d'un niveau), un grand
// livre : une ligne par membre, une colonne par mois, le montant payé dans
// chaque case, les totaux en bas et à droite. Le journal range les mêmes
// opérations par date, et la fiche de compte d'un membre les relit une par une.
//
// Un "ledger" :
//   { key, kind: "group" | "waiting", levelKey, letter, cotisation, cagnotte,
//     columns: [{ index, tour, month (dayjs), monthValue, status, beneficiaries,
//                 expectedCount, paidCount, unpaidCount, payoutsDone }],
//     rows: [{ id, name, city, position, cells: [state], paidCount, owedCount,
//              totalPaid, owed, receives: [index de colonne] }],
//     totals: { paid, owed } }
// Un état de case ("cell") : "paid" payé · "unpaid" mois passé non payé ·
// "late" mois en cours, échéance dépassée · "awaiting" mois en cours, avant
// l'échéance · "future" pas encore dû · "na" le membre n'était pas concerné.
//
// Les cotisations ne sont jamais validées par l'admin : une case est "payée"
// dès que le paiement est arrivé. Les dates des opérations sont des données de
// démonstration (stables d'un affichage à l'autre), en attendant le backend.

const hashOf = (value) => {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return hash;
};

const MAX_WAITING_MONTHS = 12;
const monthValueOf = (month) => month.format("YYYY-MM");

function finishLedger(base, columnsDraft, memberDrafts) {
  const { cotisation } = base;
  const rows = memberDrafts.map((member, position) => {
    const paidCount = member.cells.filter((cell) => cell === "paid").length;
    const owedCount = member.cells.filter((cell) => ["unpaid", "late", "awaiting"].includes(cell)).length;
    return {
      id: member.id,
      name: member.name,
      city: member.city,
      position: position + 1,
      cells: member.cells,
      paidCount,
      owedCount,
      totalPaid: paidCount * cotisation,
      owed: owedCount * cotisation,
      receives: member.receives ?? [],
    };
  });

  const columns = columnsDraft.map((column, index) => {
    const states = rows.map((row) => row.cells[index]);
    const paidCount = states.filter((cell) => cell === "paid").length;
    const unpaidCount = states.filter((cell) => ["unpaid", "late", "awaiting"].includes(cell)).length;
    return {
      ...column,
      index,
      monthValue: monthValueOf(column.month),
      expectedCount: paidCount + unpaidCount,
      paidCount,
      unpaidCount,
    };
  });

  return {
    ...base,
    columns,
    rows,
    totals: {
      paid: rows.reduce((sum, row) => sum + row.totalPaid, 0),
      owed: rows.reduce((sum, row) => sum + row.owed, 0),
    },
  };
}

function groupLedger(group) {
  const columnsDraft = group.schedule.map((slot) => {
    const beneficiaries = slot.members.map((entry) => {
      const current = group.beneficiaries.find((member) => member.id === entry.id);
      return {
        id: entry.id,
        name: entry.name,
        // Mois passé : versée. Mois en cours : la date notée par l'admin, s'il y en a une.
        paidOut: slot.status === "closed" ? true : slot.status === "current" ? Boolean(current?.payoutDate) : false,
        payoutDate: slot.status === "current" ? current?.payoutDate ?? null : null,
      };
    });
    return {
      tour: slot.tour,
      month: slot.month,
      status: slot.status,
      beneficiaries,
      payoutsDone: beneficiaries.filter((entry) => entry.paidOut).length,
    };
  });

  const memberDrafts = group.members.map((member) => ({
    id: member.id,
    name: member.name,
    city: member.city,
    cells: columnsDraft.map((column, index) => {
      if (column.status === "upcoming") return "future";
      if (index >= member.history.length) return "na";
      if (member.history[index]) return "paid";
      if (column.status === "current") return member.isLate ? "late" : "awaiting";
      return "unpaid";
    }),
    receives: columnsDraft.flatMap((column, index) =>
      column.beneficiaries.some((entry) => entry.id === member.id) ? [index] : [],
    ),
  }));

  return finishLedger(
    {
      key: group.id,
      kind: "group",
      levelKey: group.levelKey,
      letter: group.letter,
      cotisation: group.cotisation,
      cagnotte: group.payout.amount,
      groupStatus: group.status,
      tour: group.tour,
      totalTours: group.totalTours,
    },
    columnsDraft,
    memberDrafts,
  );
}

// Les membres sans groupe : une colonne par mois depuis le premier à cotiser
// (12 mois au plus), pas de tour ni de bénéficiaire.
function waitingLedger(section) {
  const now = dayjs().startOf("month");
  const first = section.members.reduce(
    (earliest, member) => (member.firstMonth.isBefore(earliest) ? member.firstMonth : earliest),
    now,
  );
  const count = Math.min(MAX_WAITING_MONTHS, now.diff(first.startOf("month"), "month") + 1);
  const columnsDraft = Array.from({ length: count }, (_unused, i) => {
    const month = now.subtract(count - 1 - i, "month");
    return { tour: null, month, status: i === count - 1 ? "current" : "closed", beneficiaries: [], payoutsDone: 0 };
  });

  const memberDrafts = section.members.map((member) => ({
    id: member.id,
    name: member.name,
    city: member.city,
    cells: columnsDraft.map((column) => {
      const offset = column.month.diff(member.firstMonth.startOf("month"), "month");
      if (offset < 0 || offset >= member.history.length) return "na";
      if (member.history[offset]) return "paid";
      if (column.status === "current") return member.state === "late" ? "late" : "awaiting";
      return "unpaid";
    }),
  }));

  return finishLedger(
    {
      key: section.key,
      kind: "waiting",
      levelKey: section.levelKey,
      letter: null,
      cotisation: section.cotisation,
      cagnotte: 0,
    },
    columnsDraft,
    memberDrafts,
  );
}

// Toutes les opérations d'un registre, une par ligne du journal :
//   "in"  : cotisation reçue · "out" : cagnotte versée · "due" : cotisation
//   d'un mois passé qui n'a pas été payée (impayé).
function operationsOf(ledger, today, dueDay) {
  const operations = [];
  ledger.columns.forEach((column) => {
    ledger.rows.forEach((row) => {
      const cell = row.cells[column.index];
      if (cell === "paid") {
        const day = 1 + (hashOf(`${ledger.key}|${row.id}|${column.monthValue}`) % dueDay);
        let date = column.month.date(day);
        if (date.isAfter(today)) date = today;
        operations.push({ kind: "in", date, amount: ledger.cotisation, row, column });
      } else if (cell === "unpaid" || cell === "late") {
        operations.push({ kind: "due", date: column.month.date(dueDay), amount: ledger.cotisation, row, column });
      }
    });
    column.beneficiaries.forEach((beneficiary) => {
      if (!beneficiary.paidOut) return;
      const row = ledger.rows.find((item) => item.id === beneficiary.id);
      if (!row) return;
      const date = beneficiary.payoutDate
        ? dayjs(beneficiary.payoutDate)
        : column.month.date(8 + (hashOf(`${ledger.key}|${beneficiary.id}|${column.monthValue}|out`) % 12));
      operations.push({ kind: "out", date, amount: ledger.cagnotte, row, column });
    });
  });
  return operations.map((operation, index) => ({
    id: `${ledger.key}|${operation.row.id}|${operation.column.monthValue}|${operation.kind}|${index}`,
    ledgerKey: ledger.key,
    levelKey: ledger.levelKey,
    letter: ledger.letter,
    kind: operation.kind,
    date: operation.date,
    month: operation.date.format("YYYY-MM"),
    dueMonth: operation.column.monthValue,
    tour: operation.column.tour,
    memberId: operation.row.id,
    name: operation.row.name,
    amount: operation.amount,
  }));
}

export function buildRegistre(groups, waitingByLevel, today = dayjs()) {
  const dueDay = getContributionDay();
  const levelOrder = new Map(levels.map((level, index) => [level.key, index]));
  const sections = buildCotisationSections(groups, waitingByLevel, today).filter((section) => section.kind === "waiting");
  const ledgers = [
    ...groups.filter((group) => group.status === "running" || group.status === "complete").map(groupLedger),
    ...sections.map(waitingLedger),
  ].sort(
    (a, b) =>
      levelOrder.get(a.levelKey) - levelOrder.get(b.levelKey) ||
      Number(a.kind === "waiting") - Number(b.kind === "waiting") ||
      String(a.letter ?? "").localeCompare(String(b.letter ?? "")),
  );

  const monthValues = new Set();
  ledgers.forEach((ledger) =>
    ledger.columns.forEach((column) => column.status !== "upcoming" && monthValues.add(column.monthValue)),
  );
  const months = [...monthValues].sort();
  const operations = ledgers.flatMap((ledger) => operationsOf(ledger, today, dueDay)).sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return { ledgers, months, operations, currentMonth: monthValueOf(today) };
}

export function useRegistre() {
  const ledger = useTontineLedger();
  const membersSnapshot = useMembersStore();
  return useMemo(
    () => buildRegistre(getGroups(ledger), getWaitingByLevel(ledger, membersSnapshot)),
    [ledger, membersSnapshot],
  );
}

// Les chiffres d'un registre pour un mois : ce qui était attendu, ce qui est
// rentré, ce qui reste à recouvrer, et les cagnottes dues / versées.
export function monthFigures(ledger, monthValue) {
  const column = ledger.columns.find((item) => item.monthValue === monthValue);
  if (!column || column.status === "upcoming") return null;
  const { cotisation, cagnotte } = ledger;
  const expected = column.expectedCount * cotisation;
  const received = column.paidCount * cotisation;
  return {
    column,
    size: column.expectedCount,
    paidCount: column.paidCount,
    unpaidCount: column.unpaidCount,
    expected,
    received,
    outstanding: column.unpaidCount * cotisation,
    rate: expected > 0 ? Math.round((received / expected) * 100) : 0,
    payoutCount: column.beneficiaries.length,
    payoutsDone: column.payoutsDone,
    payoutDue: column.beneficiaries.length * cagnotte,
    payoutPaid: column.payoutsDone * cagnotte,
  };
}

// Le relevé d'un membre, dans l'ordre des dates : ce qu'il a cotisé, les
// cagnottes reçues, et ce qui lui reste à payer. "balance" = reçu − cotisé,
// cumulé : négatif tant qu'il n'a pas encore reçu sa cagnotte.
export function memberStatement(ledger, row, operations) {
  const mine = operations
    .filter((operation) => operation.ledgerKey === ledger.key && operation.memberId === row.id)
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  let balance = 0;
  const lines = mine.map((operation) => {
    if (operation.kind === "in") balance -= operation.amount;
    if (operation.kind === "out") balance += operation.amount;
    return { ...operation, balance: operation.kind === "due" ? null : balance };
  });
  const contributed = mine.filter((operation) => operation.kind === "in").reduce((sum, item) => sum + item.amount, 0);
  const received = mine.filter((operation) => operation.kind === "out").reduce((sum, item) => sum + item.amount, 0);
  const nextTurn = row.receives
    .map((index) => ledger.columns[index])
    .find((column) => column.status !== "closed");
  return { lines, contributed, received, owed: row.owed, balance, nextTurn: nextTurn ?? null };
}
