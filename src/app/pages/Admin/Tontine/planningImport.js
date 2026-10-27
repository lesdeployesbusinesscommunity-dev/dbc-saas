// Import Dependencies
import dayjs from "dayjs";

// ----------------------------------------------------------------------
// Import d'un planning de bénéficiaires depuis un fichier CSV : qui reçoit la
// cagnotte, et quel mois. Tout ce fichier est pur (pas de React, pas de
// stockage) : on lit le texte, on retrouve chaque membre parmi ceux qui
// attendent encore un groupe, puis on vérifie chaque ligne avant de rien
// enregistrer. Une ligne fausse ne bloque pas les autres : elle est signalée
// et laissée de côté.

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// "Marie Atangana" et "ATANGANA marie" désignent la même personne.
const nameKey = (value) => normalize(value).split(" ").filter(Boolean).sort().join(" ");
const matriculeKey = (value) => String(value ?? "").toUpperCase().replace(/\s+/g, "");

// ----------------------------------------------------------------------
// Lecture du CSV

// Le texte d'un fichier : UTF-8 d'abord, puis l'encodage de Windows (les CSV
// d'Excel en français) si le fichier n'est pas de l'UTF-8 valide.
export function decodeText(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

// Découpe un CSV en lignes de cellules. Le séparateur (";", "," ou tabulation)
// est deviné sur la première ligne ; les guillemets sont gérés.
export function parseCsv(text) {
  const clean = String(text ?? "").replace(/^\ufeff/, "");
  const firstLine = clean.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const delimiter = [";", "\t", ","]
    .map((candidate) => [candidate, firstLine.split(candidate).length])
    .sort((a, b) => b[1] - a[1])[0][0];

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell.trim());
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i += 1;
      endRow();
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

// ----------------------------------------------------------------------
// Les mois : "2026-11", "11/2026", "01/11/2026", "novembre 2026", "Nov 2026"…

const MONTH_PREFIX = {
  jan: 1, fev: 2, feb: 2, mar: 3, avr: 4, apr: 4, mai: 5, may: 5,
  aou: 8, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function monthFromWord(word) {
  if (word.startsWith("juil") || word.startsWith("jul")) return 7;
  if (word.startsWith("juin") || word.startsWith("jun")) return 6;
  return MONTH_PREFIX[word.slice(0, 3)] ?? null;
}

const asMonth = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || y < 2000 || y > 2100 || m < 1 || m > 12) return null;
  return `${y}-${String(m).padStart(2, "0")}`;
};

// "AAAA-MM", ou null quand la valeur n'est pas un mois lisible.
export function parseMonthValue(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  let match = text.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?(?:[T\s].*)?$/);
  if (match) return asMonth(match[1], match[2]);
  match = text.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (match) return asMonth(match[2], match[1]);
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return asMonth(match[3], match[2]);

  const words = normalize(text);
  match = words.match(/^([a-z]{3,})\s+(\d{4})$/) ?? words.match(/^(\d{4})\s+([a-z]{3,})$/);
  if (match) {
    const [word, year] = /^\d/.test(match[1]) ? [match[2], match[1]] : [match[1], match[2]];
    const month = monthFromWord(word);
    return month ? asMonth(year, month) : null;
  }
  return null;
}

// ----------------------------------------------------------------------
// Les colonnes : repérées par leur titre ("matricule", "nom", "mois"…), ou,
// sans titre, devinées d'après le contenu des cellules.

const HEADER_WORDS = {
  matricule: ["matricule", "identifiant", "id", "code", "numero", "member id"],
  name: ["nom", "noms", "nom complet", "name", "full name", "membre", "member", "beneficiaire", "beneficiary"],
  month: ["mois", "month", "date", "periode", "period", "mois de passage", "mois de reception", "tour"],
};

function columnOf(headerCells, field) {
  return headerCells.findIndex((cell) => HEADER_WORDS[field].includes(normalize(cell)));
}

const looksLikeMatricule = (value) => /^[A-Za-z]{2,6}[-\s]?\d+([-\s]\d+)*$/.test(String(value ?? "").trim());

// Les lignes du fichier : [{ line, matricule, name, month }] ("line" : le
// numéro de la ligne dans le fichier, pour la retrouver dans Excel).
export function readPlanningRows(text) {
  const table = parseCsv(text);
  if (table.length === 0) return [];

  const header = table[0];
  let matriculeCol = columnOf(header, "matricule");
  let nameCol = columnOf(header, "name");
  let monthCol = columnOf(header, "month");
  const hasHeader = monthCol >= 0 || nameCol >= 0 || matriculeCol >= 0;
  const body = hasHeader ? table.slice(1) : table;
  const firstLine = hasHeader ? 2 : 1;

  if (!hasHeader || monthCol < 0) {
    const width = Math.max(...table.map((row) => row.length));
    const score = (col, test) => body.filter((row) => test(row[col])).length;
    const cols = Array.from({ length: width }, (_unused, col) => col);
    if (monthCol < 0) {
      monthCol = cols.reduce((best, col) => (score(col, parseMonthValue) > score(best, parseMonthValue) ? col : best), -1);
      if (monthCol >= 0 && score(monthCol, parseMonthValue) === 0) monthCol = -1;
    }
    if (matriculeCol < 0) {
      const found = cols.find((col) => col !== monthCol && score(col, looksLikeMatricule) > body.length / 2);
      matriculeCol = found ?? -1;
    }
    if (nameCol < 0) nameCol = cols.find((col) => col !== monthCol && col !== matriculeCol) ?? -1;
  }

  return body.map((row, index) => ({
    line: firstLine + index,
    matricule: matriculeCol >= 0 ? (row[matriculeCol] ?? "") : "",
    name: nameCol >= 0 ? (row[nameCol] ?? "") : "",
    month: monthCol >= 0 ? (row[monthCol] ?? "") : "",
  }));
}

// ----------------------------------------------------------------------
// Vérification des lignes

// rows       : lire avec readPlanningRows.
// candidates : les membres du niveau qui attendent un groupe
//              [{ id, name, city, matricule? }].
// others     : les autres membres connus [{ name, matricule }], pour dire
//              "déjà placé ou d'un autre niveau" plutôt que "introuvable".
// target     : { mode: "new", perTour, groupSize, totalTours } pour un nouveau
//              groupe, ou { mode: "group", free: { "AAAA-MM": places } } pour
//              remplir les mois libres d'un groupe ouvert.
// Chaque ligne reçoit soit un mois et un membre (prête), soit une "reason"
// qui dit pourquoi elle est laissée de côté.
export function buildPlanningPlan({ rows, candidates, others = [], target, today = dayjs() }) {
  const byMatricule = new Map(candidates.filter((c) => c.matricule).map((c) => [matriculeKey(c.matricule), c]));
  const byName = new Map();
  candidates.forEach((candidate) => {
    const key = nameKey(candidate.name);
    byName.set(key, [...(byName.get(key) ?? []), candidate]);
  });
  const knownElsewhere = new Set([
    ...others.filter((o) => o.matricule).map((o) => matriculeKey(o.matricule)),
    ...others.map((o) => nameKey(o.name)),
  ]);

  const items = rows.map((row) => {
    const item = { ...row, member: null, monthValue: null, reason: null, params: {} };

    let member = row.matricule ? (byMatricule.get(matriculeKey(row.matricule)) ?? null) : null;
    if (!member && row.name) {
      const matches = byName.get(nameKey(row.name)) ?? [];
      if (matches.length > 1) {
        item.reason = "ambiguous";
        return item;
      }
      member = matches[0] ?? null;
    }
    if (!member) {
      const known =
        (row.matricule && knownElsewhere.has(matriculeKey(row.matricule))) ||
        (row.name && knownElsewhere.has(nameKey(row.name)));
      item.reason = known ? "notWaiting" : "unknown";
      return item;
    }
    item.member = member;

    item.monthValue = parseMonthValue(row.month);
    if (!item.monthValue) {
      item.reason = "badMonth";
      return item;
    }
    return item;
  });

  const pending = items.filter((item) => !item.reason);
  const placedPerMonth = new Map();
  // Un membre n'a qu'un seul mois : s'il figure plusieurs fois, la première
  // ligne valable est gardée et les suivantes sont signalées.
  const taken = new Set();
  const take = (item) => {
    if (taken.has(item.member.id)) {
      item.reason = "duplicate";
      return false;
    }
    return true;
  };
  let startMonth = null;

  if (target.mode === "new") {
    const oldest = today.startOf("month").subtract(target.totalTours - 1, "month").format("YYYY-MM");
    pending.forEach((item) => {
      if (item.monthValue < oldest) item.reason = "tooOld";
    });
    const usable = pending.filter((item) => !item.reason).map((item) => item.monthValue);
    startMonth = usable.length ? usable.reduce((a, b) => (a < b ? a : b)) : null;
    const last = startMonth ? dayjs(`${startMonth}-01`).add(target.totalTours - 1, "month").format("YYYY-MM") : null;
    let total = 0;
    pending.forEach((item) => {
      if (item.reason) return;
      if (item.monthValue > last) {
        item.reason = "outOfCycle";
        item.params = { start: startMonth };
      } else if (!take(item)) {
        // signalée comme doublon
      } else if ((placedPerMonth.get(item.monthValue) ?? 0) >= target.perTour) {
        item.reason = "monthFull";
        item.params = { month: item.monthValue };
      } else if (total >= target.groupSize) {
        item.reason = "groupFull";
      } else {
        placedPerMonth.set(item.monthValue, (placedPerMonth.get(item.monthValue) ?? 0) + 1);
        taken.add(item.member.id);
        total += 1;
      }
    });
  } else {
    pending.forEach((item) => {
      const room = target.free[item.monthValue] ?? 0;
      if (room === 0) {
        item.reason = "monthNotFree";
      } else if (!take(item)) {
        // signalée comme doublon
      } else if ((placedPerMonth.get(item.monthValue) ?? 0) >= room) {
        item.reason = "monthFull";
        item.params = { month: item.monthValue };
      } else {
        placedPerMonth.set(item.monthValue, (placedPerMonth.get(item.monthValue) ?? 0) + 1);
        taken.add(item.member.id);
      }
    });
  }

  const accepted = items
    .filter((item) => !item.reason)
    .map((item) => ({
      id: item.member.id,
      name: item.member.name,
      city: item.member.city ?? "",
      month: item.monthValue,
    }));

  return {
    items,
    accepted,
    startMonth: accepted.length ? startMonth : null,
    readyCount: accepted.length,
    problemCount: items.length - accepted.length,
  };
}

// Les lignes du fichier modèle : les premiers membres qui attendent, trois par
// mois à partir de "startMonth" — de quoi voir à quoi ressemble un planning.
export function templateRows({ candidates, startMonth, perTour, header }) {
  const first = dayjs(`${startMonth}-01`);
  return [
    header,
    ...candidates
      .slice(0, perTour * 2)
      .map((member, index) => [
        member.matricule ?? "",
        member.name,
        first.add(Math.floor(index / perTour), "month").format("YYYY-MM"),
      ]),
  ];
}
